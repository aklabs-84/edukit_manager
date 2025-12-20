/**
 * 에듀킷 매니저 - 관리자 기능 Apps Script
 *
 * 이 코드를 기존 Google Apps Script에 추가하세요.
 *
 * 필요한 시트:
 * 1. "설정" 시트 - 학교 정보 저장
 *    | A (학교이름) | B (학교코드) | C (스크립트URL) | D (스프레드시트URL) |
 *    | E (드라이브폴더URL) | F (카테고리JSON) | G (생성일) |
 *
 * 2. "관리자" 시트 - 관리자 계정 정보
 *    | A (아이디) | B (비밀번호) |
 *    | admin     | your_password |
 *
 * 주의: 비밀번호는 평문으로 저장됩니다.
 * 보안이 중요하다면 해시 처리를 권장합니다.
 */

// ============================================
// 설정 관련 함수들
// ============================================

/**
 * 모든 학교 설정 조회
 */
function getSchoolSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('설정');

  if (!sheet) {
    return { success: true, data: [] };
  }

  const data = sheet.getDataRange().getValues();
  const schools = [];

  // 헤더 제외 (첫 번째 행)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // 학교이름이 있는 경우만
      const normalized = normalizeSchoolRow(row);
      schools.push(normalized);
    }
  }

  return { success: true, data: schools };
}

function parseCategories(value) {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (err) {
      // ignore
    }
  }
  return [];
}

function normalizeSchoolRow(row) {
  const name = row[0] || '';
  const code = row[1] || '';
  const scriptUrl = row[2] || '';

  const col4 = row[3];
  const col5 = row[4];
  const col6 = row[5];
  const col7 = row[6];

  const col4IsUrl = typeof col4 === 'string' && col4.indexOf('http') === 0;
  const sheetUrl = col4IsUrl ? (col4 || '') : (col5 || '');
  const driveFolderUrl = col4IsUrl ? (col5 || '') : (col6 || '');
  const categories = col4IsUrl ? parseCategories(col6) : parseCategories(col7);
  const createdAtRaw = col4IsUrl ? col7 : col4;
  const createdAt = createdAtRaw ? new Date(createdAtRaw).toISOString() : null;

  return {
    name,
    code,
    scriptUrl,
    sheetUrl,
    driveFolderUrl,
    categories,
    createdAt
  };
}

/**
 * 학교 코드로 학교 정보 조회
 */
function getSchoolByCode(code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('설정');

  if (!sheet) {
    return { success: false, message: '설정 시트가 없습니다.' };
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === code) {
      return {
        success: true,
        data: normalizeSchoolRow(row)
      };
    }
  }

  return { success: false, message: '해당 코드의 학교를 찾을 수 없습니다.' };
}

/**
 * 새 학교 추가
 */
function addSchool(name, code, scriptUrl, sheetUrl, driveFolderUrl, categories) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('설정');

  // 설정 시트가 없으면 생성
  if (!sheet) {
    sheet = ss.insertSheet('설정');
    sheet.appendRow(['학교이름', '학교코드', '스크립트URL', '스프레드시트URL', '드라이브폴더URL', '카테고리JSON', '생성일']);
  }

  // 중복 코드 체크
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === code) {
      return { success: false, message: '이미 존재하는 학교 코드입니다.' };
    }
    if (data[i][0] === name) {
      return { success: false, message: '이미 존재하는 학교 이름입니다.' };
    }
  }

  // 새 학교 추가
  const createdAt = new Date().toISOString();
  const categoryJson = categories ? JSON.stringify(categories) : JSON.stringify([]);
  sheet.appendRow([name, code, scriptUrl, sheetUrl || '', driveFolderUrl || '', categoryJson, createdAt]);

  return {
    success: true,
    data: { name, code, scriptUrl, sheetUrl: sheetUrl || '', driveFolderUrl: driveFolderUrl || '', categories: categories || [], createdAt },
    message: '학교가 추가되었습니다.'
  };
}

/**
 * 학교 정보 수정
 */
function updateSchool(originalCode, name, code, scriptUrl, sheetUrl, driveFolderUrl, categories) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('설정');

  if (!sheet) {
    return { success: false, message: '설정 시트가 없습니다.' };
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === originalCode) {
      // 새 코드가 다른 학교와 중복되는지 체크
      if (code !== originalCode) {
        for (let j = 1; j < data.length; j++) {
          if (j !== i && data[j][1] === code) {
            return { success: false, message: '이미 존재하는 학교 코드입니다.' };
          }
        }
      }

      // 수정
      sheet.getRange(i + 1, 1).setValue(name);
      sheet.getRange(i + 1, 2).setValue(code);
      sheet.getRange(i + 1, 3).setValue(scriptUrl);
      sheet.getRange(i + 1, 4).setValue(sheetUrl || '');
      sheet.getRange(i + 1, 5).setValue(driveFolderUrl || '');
      if (typeof categories !== 'undefined') {
        sheet.getRange(i + 1, 6).setValue(JSON.stringify(categories || []));
      }

      return {
        success: true,
        data: normalizeSchoolRow(sheet.getRange(i + 1, 1, 1, 7).getValues()[0]),
        message: '학교 정보가 수정되었습니다.'
      };
    }
  }

  return { success: false, message: '해당 학교를 찾을 수 없습니다.' };
}

function updateSchoolCategories(code, categories) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('설정');

  if (!sheet) {
    return { success: false, message: '설정 시트가 없습니다.' };
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === code) {
      sheet.getRange(i + 1, 6).setValue(JSON.stringify(categories || []));
      return {
        success: true,
        data: normalizeSchoolRow(sheet.getRange(i + 1, 1, 1, 7).getValues()[0]),
        message: '카테고리가 저장되었습니다.'
      };
    }
  }

  return { success: false, message: '해당 학교를 찾을 수 없습니다.' };
}

/**
 * 학교 삭제
 */
function deleteSchool(code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('설정');

  if (!sheet) {
    return { success: false, message: '설정 시트가 없습니다.' };
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === code) {
      sheet.deleteRow(i + 1);
      return { success: true, message: '학교가 삭제되었습니다.' };
    }
  }

  return { success: false, message: '해당 학교를 찾을 수 없습니다.' };
}

// ============================================
// 관리자 인증 함수
// ============================================

/**
 * 관리자 로그인
 */
function adminLogin(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('관리자');

  // 관리자 시트가 없으면 생성
  if (!sheet) {
    sheet = ss.insertSheet('관리자');
    sheet.appendRow(['아이디', '비밀번호']);
    sheet.appendRow(['admin', 'admin123']); // 기본 비밀번호
  }

  const data = sheet.getDataRange().getValues();

  // 시트가 비어있거나 헤더만 있는 경우 기본 계정 추가
  if (data.length <= 1) {
    if (data.length === 0) {
      sheet.appendRow(['아이디', '비밀번호']);
    }
    sheet.appendRow(['admin', 'admin123']);

    if (username === 'admin' && password === 'admin123') {
      return { success: true, message: '로그인 성공 (기본 비밀번호를 변경해주세요)' };
    }
    return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }

  // 계정 확인
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === password) {
      return { success: true, message: '로그인 성공' };
    }
  }

  return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
}

/**
 * 관리자 비밀번호 변경
 */
function changeAdminPassword(username, oldPassword, newPassword) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('관리자');

  if (!sheet) {
    return { success: false, message: '관리자 시트가 없습니다.' };
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === oldPassword) {
      sheet.getRange(i + 1, 2).setValue(newPassword);
      return { success: true, message: '비밀번호가 변경되었습니다.' };
    }
  }

  return { success: false, message: '현재 비밀번호가 올바르지 않습니다.' };
}

// ============================================
// doGet / doPost 확장
// ============================================

/**
 * 기존 doGet 함수에 아래 케이스들을 추가하세요
 */
function doGet_admin(e) {
  const action = e.parameter.action;

  switch (action) {
    case 'getSchools':
      return ContentService.createTextOutput(JSON.stringify(getSchoolSettings()))
        .setMimeType(ContentService.MimeType.JSON);

    case 'verifyCode':
      const code = e.parameter.code;
      return ContentService.createTextOutput(JSON.stringify(getSchoolByCode(code)))
        .setMimeType(ContentService.MimeType.JSON);

    default:
      // 기존 doGet 로직 유지
      break;
  }
}

/**
 * 기존 doPost 함수에 아래 케이스들을 추가하세요
 */
function doPost_admin(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  let result;

  switch (action) {
    case 'adminLogin':
      result = adminLogin(data.username, data.password);
      break;

    case 'addSchool':
      result = addSchool(data.name, data.code, data.scriptUrl, data.sheetUrl, data.driveFolderUrl, data.categories);
      break;

    case 'updateSchool':
      result = updateSchool(data.originalCode, data.name, data.code, data.scriptUrl, data.sheetUrl, data.driveFolderUrl, data.categories);
      break;

    case 'deleteSchool':
      result = deleteSchool(data.code);
      break;

    case 'changePassword':
      result = changeAdminPassword(data.username, data.oldPassword, data.newPassword);
      break;

    case 'updateCategories':
      result = updateSchoolCategories(data.code, data.categories);
      break;

    default:
      // 기존 doPost 로직 유지 (create, update, delete 재고 항목)
      break;
  }

  if (result) {
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// 통합된 doGet / doPost 예시
// ============================================

/**
 * 아래는 기존 코드와 통합한 전체 doGet 예시입니다.
 * 기존 doGet 함수를 이것으로 교체하세요.
 */
function doGet(e) {
  const action = e.parameter.action;

  // 관리자 기능
  if (action === 'getSchools') {
    return ContentService.createTextOutput(JSON.stringify(getSchoolSettings()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'verifyCode') {
    const code = e.parameter.code;
    return ContentService.createTextOutput(JSON.stringify(getSchoolByCode(code)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 기존 재고 조회 로직
  const school = e.parameter.school || '대건고';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(school);

  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: '해당 학교 시트를 찾을 수 없습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      items.push({
        id: row[0],
        name: row[1],
        category: row[2],
        quantity: row[3],
        location: row[4],
        status: row[5],
        lastUpdated: row[6],
        school: school,
        notes: row[7] || '',
        imageUrl: row[8] || ''
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: items
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 아래는 기존 코드와 통합한 전체 doPost 예시입니다.
 * 기존 doPost 함수를 이것으로 교체하세요.
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  // 관리자 기능
  switch (action) {
    case 'adminLogin':
      return ContentService.createTextOutput(JSON.stringify(
        adminLogin(data.username, data.password)
      )).setMimeType(ContentService.MimeType.JSON);

    case 'addSchool':
      return ContentService.createTextOutput(JSON.stringify(
        addSchool(data.name, data.code, data.scriptUrl, data.sheetUrl, data.driveFolderUrl, data.categories)
      )).setMimeType(ContentService.MimeType.JSON);

    case 'updateSchool':
      return ContentService.createTextOutput(JSON.stringify(
        updateSchool(data.originalCode, data.name, data.code, data.scriptUrl, data.sheetUrl, data.driveFolderUrl, data.categories)
      )).setMimeType(ContentService.MimeType.JSON);

    case 'deleteSchool':
      return ContentService.createTextOutput(JSON.stringify(
        deleteSchool(data.code)
      )).setMimeType(ContentService.MimeType.JSON);

    case 'changePassword':
      return ContentService.createTextOutput(JSON.stringify(
        changeAdminPassword(data.username, data.oldPassword, data.newPassword)
      )).setMimeType(ContentService.MimeType.JSON);

    case 'updateCategories':
      return ContentService.createTextOutput(JSON.stringify(
        updateSchoolCategories(data.code, data.categories)
      )).setMimeType(ContentService.MimeType.JSON);
  }

  // 기존 재고 관리 로직 (create, update, delete)
  const school = data.school || data.data?.school || '대건고';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(school);

  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: '해당 학교 시트를 찾을 수 없습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  let result = { success: false, message: '알 수 없는 작업입니다.' };

  if (action === 'create') {
    const item = data.data;
    sheet.appendRow([
      item.id,
      item.name,
      item.category,
      item.quantity,
      item.location,
      item.status,
      item.lastUpdated,
      item.notes || '',
      item.imageUrl || ''
    ]);
    result = { success: true, message: '항목이 추가되었습니다.' };
  }

  if (action === 'update') {
    const item = data.data;
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === item.id) {
        sheet.getRange(i + 1, 1, 1, 9).setValues([[
          item.id,
          item.name,
          item.category,
          item.quantity,
          item.location,
          item.status,
          item.lastUpdated,
          item.notes || '',
          item.imageUrl || ''
        ]]);
        result = { success: true, message: '항목이 수정되었습니다.' };
        break;
      }
    }
  }

  if (action === 'delete') {
    const id = data.id;
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        sheet.deleteRow(i + 1);
        result = { success: true, message: '항목이 삭제되었습니다.' };
        break;
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
