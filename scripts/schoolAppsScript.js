/**
 * 에듀킷 매니저 - 학교별 재고 관리 Apps Script
 *
 * ============================================
 * 사용 방법
 * ============================================
 *
 * 1. 새 Google Sheets 만들기
 * 2. 시트 이름을 학교 이름으로 변경 (예: "대건고")
 * 3. 첫 번째 행에 헤더 추가:
 *    | id | name | category | quantity | location | status | lastUpdated | notes | imageUrl |
 *
 * 4. 확장 프로그램 → Apps Script 클릭
 * 5. 이 코드를 전체 복사하여 붙여넣기
 * 6. 저장 후 배포:
 *    - 배포 → 새 배포
 *    - 유형: 웹 앱
 *    - 실행 주체: 본인
 *    - 액세스 권한: 모든 사용자
 * 7. 생성된 URL을 관리자 페이지에서 해당 학교의 "Apps Script URL"에 입력
 *
 * ============================================
 * 주의사항
 * ============================================
 * - 시트 이름이 학교 이름과 일치해야 합니다
 * - 또는 DEFAULT_SHEET_NAME을 수정하세요
 */

// 기본 시트 이름 (학교 이름으로 변경하세요)
const DEFAULT_SHEET_NAME = '재고';

// 이미지 저장 폴더 ID (Google Drive 폴더)
const IMAGE_FOLDER_ID = '1_0b88uUamSgomtjjEvEK3jsgVoyADKdH';

/**
 * GET 요청 처리 - 재고 조회
 */
function doGet(e) {
  try {
    const school = e.parameter.school || DEFAULT_SHEET_NAME;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(school);

    // 시트가 없으면 기본 시트 사용
    const targetSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_SHEET_NAME);

    if (!targetSheet) {
      return createResponse({
        success: false,
        message: '시트를 찾을 수 없습니다. 시트 이름을 확인해주세요.'
      });
    }

    const data = targetSheet.getDataRange().getValues();
    const items = [];

    // 헤더 제외 (첫 번째 행)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // id가 있는 경우만
        items.push({
          id: row[0],
          name: row[1] || '',
          category: row[2] || '',
          quantity: row[3] || 0,
          location: row[4] || '',
          status: row[5] || '재고 있음',
          lastUpdated: row[6] || new Date().toISOString(),
          notes: row[7] || '',
          imageUrl: row[8] || '',
          school: school
        });
      }
    }

    return createResponse({
      success: true,
      data: items
    });

  } catch (error) {
    return createResponse({
      success: false,
      message: '데이터 조회 중 오류가 발생했습니다: ' + error.message
    });
  }
}

/**
 * POST 요청 처리 - 재고 추가/수정/삭제
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const school = requestData.school || requestData.data?.school || DEFAULT_SHEET_NAME;

    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(school);

    // 시트가 없으면 기본 시트 사용
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_SHEET_NAME);
    }

    // 그래도 없으면 생성
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(DEFAULT_SHEET_NAME);
      // 헤더 추가
      sheet.appendRow(['id', 'name', 'category', 'quantity', 'location', 'status', 'lastUpdated', 'notes', 'imageUrl']);
    }

    let result = { success: false, message: '알 수 없는 작업입니다.' };

    switch (action) {
      case 'create':
        result = createItem(sheet, requestData.data);
        break;

      case 'update':
        result = updateItem(sheet, requestData.data);
        break;

      case 'delete':
        result = deleteItem(sheet, requestData.id);
        break;

      case 'uploadImage':
        result = uploadImageToFolder(requestData.imageData, requestData.fileName);
        break;

      default:
        result = { success: false, message: '지원하지 않는 작업입니다: ' + action };
    }

    return createResponse(result);

  } catch (error) {
    return createResponse({
      success: false,
      message: '요청 처리 중 오류가 발생했습니다: ' + error.message
    });
  }
}

/**
 * 새 항목 추가
 */
function createItem(sheet, item) {
  if (!item || !item.name) {
    return { success: false, message: '항목 정보가 올바르지 않습니다.' };
  }

  const id = item.id || generateId();
  const now = new Date().toISOString();

  sheet.appendRow([
    id,
    item.name,
    item.category || '',
    item.quantity || 0,
    item.location || '',
    item.status || '재고 있음',
    item.lastUpdated || now,
    item.notes || '',
    item.imageUrl || ''
  ]);

  return {
    success: true,
    message: '항목이 추가되었습니다.',
    data: { id }
  };
}

/**
 * 항목 수정
 */
function updateItem(sheet, item) {
  if (!item || !item.id) {
    return { success: false, message: '항목 ID가 필요합니다.' };
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === item.id) {
      const now = new Date().toISOString();

      sheet.getRange(i + 1, 1, 1, 9).setValues([[
        item.id,
        item.name || data[i][1],
        item.category || data[i][2],
        item.quantity !== undefined ? item.quantity : data[i][3],
        item.location || data[i][4],
        item.status || data[i][5],
        item.lastUpdated || now,
        item.notes !== undefined ? item.notes : data[i][7],
        item.imageUrl !== undefined ? item.imageUrl : data[i][8]
      ]]);

      return { success: true, message: '항목이 수정되었습니다.' };
    }
  }

  return { success: false, message: '해당 항목을 찾을 수 없습니다.' };
}

/**
 * 항목 삭제
 */
function deleteItem(sheet, id) {
  if (!id) {
    return { success: false, message: '항목 ID가 필요합니다.' };
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: '항목이 삭제되었습니다.' };
    }
  }

  return { success: false, message: '해당 항목을 찾을 수 없습니다.' };
}

/**
 * 고유 ID 생성
 */
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * JSON 응답 생성
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 이미지 업로드 (지정된 Google Drive 폴더에 저장)
 * IMAGE_FOLDER_ID에 지정된 폴더에 이미지를 저장합니다.
 */
function uploadImageToFolder(base64Data, fileName) {
  try {
    if (!base64Data) {
      return { success: false, message: '이미지 데이터가 없습니다.' };
    }

    // Base64 데이터에서 헤더 제거 및 MIME 타입 추출
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    let mimeType = 'image/png';
    let base64Content = base64Data;

    if (matches) {
      mimeType = 'image/' + matches[1];
      base64Content = matches[2];
    } else {
      // 헤더가 없는 경우 그대로 사용
      base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    }

    // 파일명 생성 (없으면 타임스탬프 사용)
    const finalFileName = fileName || ('image_' + new Date().getTime() + '.png');

    // Blob 생성
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), mimeType, finalFileName);

    // 지정된 폴더에 저장
    const folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
    const file = folder.createFile(blob);

    // 누구나 볼 수 있도록 공유 설정
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 직접 접근 가능한 URL 반환 (lh3 형식이 img 태그에서 더 잘 작동함)
    const fileId = file.getId();
    return {
      success: true,
      url: 'https://lh3.googleusercontent.com/d/' + fileId,
      fileId: fileId,
      fileName: finalFileName
    };
  } catch (error) {
    return {
      success: false,
      message: '이미지 업로드 실패: ' + error.message
    };
  }
}

/**
 * 이미지 업로드 (Google Drive 루트에 저장) - 레거시 함수
 */
function uploadImage(base64Data, fileName) {
  return uploadImageToFolder(base64Data, fileName);
}

/**
 * 테스트 함수 - Apps Script 편집기에서 실행하여 동작 확인
 */
function testGetItems() {
  const mockEvent = {
    parameter: {
      school: DEFAULT_SHEET_NAME
    }
  };

  const result = doGet(mockEvent);
  Logger.log(result.getContent());
}

function testCreateItem() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'create',
        data: {
          name: '테스트 교구',
          category: '키트',
          quantity: 10,
          location: '창고 A',
          status: '재고 있음',
          notes: '테스트용'
        }
      })
    }
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
