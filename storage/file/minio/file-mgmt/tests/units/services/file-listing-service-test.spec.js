const FileListingService = require('../../../src/services/file-listing-service');

const MinIoRepositoryMock = require('../../mocks/minio-repository-mock');
const LoggerMock = require('../../mocks/logger-mock');

describe('FileListingService', () => {
  let fileListingService;
  beforeEach(() => {
    fileListingService = new FileListingService(new MinIoRepositoryMock(), LoggerMock);
  });

  it('Should return an array', async () => {
    const files = await fileListingService.list('test', '', 4, undefined);

    expect(files.length).toEqual(4);
  });

  it('Should return a not found http error, when the tenant does not exist', async () => {
    let error;
    try {
      await fileListingService.list('test_error', '', 4, undefined);
    } catch (e) {
      error = e;
    }

    expect(error.responseJSON.error).toEqual('Tenant does not exist.');
    expect(error.responseJSON.detail).toEqual('There is no bucket for this tenant.');
  });

  it('return a bad request http error, when the limit is not number', async () => {
    let error;
    try {
      await fileListingService.list('test', '', 'number invalid', undefined);
    } catch (e) {
      error = e;
    }

    expect(error.responseJSON.error).toEqual('The limit param is invalid or undefined.');
    expect(error.responseJSON.detail).toEqual('The limit param is required and must be a positive integer.');
  });

  it('return a bad request http error, when the limit is not integer', async () => {
    let error;
    try {
      await fileListingService.list('test', '', 2.5, undefined);
    } catch (e) {
      error = e;
    }

    expect(error.responseJSON.error).toEqual('The limit param is invalid or undefined.');
    expect(error.responseJSON.detail).toEqual('The limit param is required and must be a positive integer.');
  });

  it('return a bad request http error, when the limit is negative', async () => {
    let error;
    try {
      await fileListingService.list('test', '', -2, undefined);
    } catch (e) {
      error = e;
    }

    expect(error.responseJSON.error).toEqual('The limit param is invalid or undefined.');
    expect(error.responseJSON.detail).toEqual('The limit param is required and must be a positive integer.');
  });
});
