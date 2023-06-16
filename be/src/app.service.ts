import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { google } from 'googleapis';
import { Repository } from 'typeorm';
import { App } from './app.entity';

@Injectable()
export class AppService {
  private readonly Logger = new Logger(AppService.name);
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
  ) {}

  async getGoogleAuth() {
    const findGoogleKey = await this.appRepository.findOne({
      where: { id: 1 },
    });
    const private_key = findGoogleKey.value.private_key;
    const client_email = findGoogleKey.value.client_email;
    return await new google.auth.JWT(client_email, null, private_key, [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.metadata',
    ]);
  }
  async getSheetsService() {
    return await google.sheets({
      version: 'v4',
      auth: await this.getGoogleAuth(),
    });
  }

  async getDriveService() {
    return await google.drive({
      version: 'v3',
      auth: await this.getGoogleAuth(),
    });
  }

  async googleCreateKey(value: { private_key: string; client_email: string }) {
    try {
      const google = new App();
      value = {
        private_key: value.private_key,
        client_email: value.client_email,
      };
      google.value = value;
      await this.appRepository.save(google);
      return google;
    } catch (err) {
      this.Logger.error(err);
      throw new InternalServerErrorException(err);
    }
  }

  async googleSpreadSheet(
    values: string[][],
    sheet_id: string,
    firstCall: boolean,
  ) {
    const googleSheet = await this.getSheetsService();
    const drive = await this.getDriveService();

    // 파일 생성
    const createSpreadSheet = await drive.files.create({
      requestBody: {
        name: '시트제목',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: ['디렉토리 뒤에 url'],
      },
    });

    // 시트 탭 삭제
    await googleSheet.spreadsheets.batchUpdate({
      spreadsheetId: '',
      requestBody: {
        requests: [
          {
            deleteSheet: {
              sheetId: 0,
            },
          },
        ],
      },
    });

    //  시트 탭 추가
    await googleSheet.spreadsheets.batchUpdate({
      spreadsheetId: '',
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: `06월_1주`,
              },
            },
          },
        ],
      },
    });

    // 열 추가
    await googleSheet.spreadsheets.values.append({
      spreadsheetId: '',
      range: `06월_1주!A2:E5`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    // sheet permission
    const res = await drive.permissions.create({
      fileId: '',
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // get sheetId
    const ress = await googleSheet.spreadsheets.get({
      spreadsheetId: '',
    });
  }
}
