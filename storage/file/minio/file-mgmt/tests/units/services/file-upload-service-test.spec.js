const MinIoRepositoryMock = require('../../mocks/minio-repository-mock');
const LoggerMock = require('../../mocks/logger-mock');

const mockValidator = {
  validate: jest.fn((path, logger, fn) => {
    fn();
  }),
};
jest.mock('../../../src/utils/path-validator-util', () => mockValidator);

const FileUploadService = require('../../../src/services/file-upload-service');

describe('FileUploadService', () => {
  let fileUploadService;
  beforeEach(() => {
    fileUploadService = new FileUploadService(new MinIoRepositoryMock(), LoggerMock);
  });

  it('Should commit the file and return a file statistics', async () => {
    const file = {
      transactionCode: 'uuid',
      info: {
        etag: 'md5',
        versionId: null,
      },
    };

    const fileStat = await fileUploadService.handle('test', file, '', 'md5');

    expect(fileStat).toEqual(file);
  });

  it('Should return an error, when the md5 does not match', async () => {
    let error;

    const file = {
      info: {
        etag: 'md5',
      },
    };

    try {
      await fileUploadService.handle('test', file, '', 'md5error');
    } catch (e) {
      error = e;
    }

    expect(error.responseJSON.error).toEqual('The "md5" is invalid.');
    expect(error.responseJSON.detail).toEqual('The "md5" is invalid.');
  });
});
