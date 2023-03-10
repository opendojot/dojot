const {
  WebUtils: {
    framework,
  },
} = require('@dojot/microservice-sdk');
const PathValidatorUtil = require('../utils/path-validator-util');
/**
 * File Retrieval Service
 *
 */
module.exports = class FileRetrievalService {
  constructor(minioRepository, logger) {
    this.minioRepository = minioRepository;
    this.logger = logger;
  }

  /**
   * Checks if the file was found.
   *
   * @param {any} file the file
   */
  checkFile = (file) => {
    if (!file) {
      throw framework.errorTemplate.NotFound('The file does not exist.', 'The file does not exist.');
    }
  }

  /**
   * Retrieves a file.
   *
   * @param {string} tenant The tenant to which the file belongs
   * @param {string} path File path
   *
   * @returns an object with the file stream and the file's metadata.
   */
  download = async (tenant, path) => {
    const file = await this.minioRepository.getObject(tenant, path);
    this.checkFile(file);

    return file;
  }

  /**
   * Gets a url to download the file directly from the MinIo.
   *
   * @param {*} tenant The tenant to which the file belongs
   * @param {*} path File path
   *
   * @returns an object with the MinIO URL to the file and the file's metadata.
   */
  getUrl = async (tenant, path) => {
    const fileData = await this.minioRepository.getObjectUrl(tenant, path);
    this.checkFile(fileData);

    return fileData;
  }

  /**
   * Operation handler.
   *
   * @param {*} tenant The tenant to which the file belongs
   * @param {*} path File path
   * @param {*} alt Sets which operation will be runned
   *
   * @returns an object with the MinIO URL to the file or a file stream associated
   *  with the file's metadata.
   */
  handle = async (tenant, path, alt) => {
    if (!(await this.minioRepository.bucketExists(tenant))) {
      this.logger.debug('Tenant does not exist.');
      throw framework.errorTemplate.BadRequest('Tenant does not exist.', 'There is no bucket for this tenant.');
    }

    if (!alt) {
      throw framework.errorTemplate.BadRequest('The "alt" param is required', 'The "alt" param is required');
    }
    await PathValidatorUtil.validate(path, this.logger);

    if (alt === 'media') {
      return this.download(tenant, path);
    }

    if (alt === 'url') {
      return this.getUrl(tenant, path);
    }

    throw framework.errorTemplate.BadRequest('The "alt" param is invalid', 'The value of the "alt" parameter must be "media" or "url".');
  }
};
