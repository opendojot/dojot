const mockAxios = {
  default: {
    create: jest.fn(() => ({
      // eslint-disable-next-line no-unused-vars
      get: jest.fn((url, options) => {
        if (url) {
          return {
            data: ['device1', 'device2'],
          };
        }

        throw new Error('Error');
      }),
    })),
  },
};
jest.mock('axios', () => mockAxios);

const DeviceService = require('../../app/sync/DeviceManagerService');


describe('DeviceService', () => {
  let deviceService;

  it('Should return a list of device', async () => {
    deviceService = new DeviceService('apidevice');
    const devices = await deviceService.getDevices('tenant1');

    expect(devices).toEqual(['device1', 'device2']);
  });

  it('Should return a list of device in multiple requests when there are more than 100 devices', async () => {
    deviceService = new DeviceService('apidevice');
    mockAxios.default.create.mockImplementationOnce(() => ({
      // eslint-disable-next-line no-unused-vars
      get: jest.fn((url, options) => ({
        data: Array.from({ length: 203 }, () => 'device'),
      })),
    }));

    const devices = await deviceService.getDevices('tenant1');

    expect(devices.length).toEqual(203);
  });

  it('Should throw a error, when the request failed ', async () => {
    let error;
    deviceService = new DeviceService(null);
    try {
      await deviceService.getDevices('tenant1');
    } catch (e) {
      error = e;
    }

    expect(error.message).toEqual('Error');
  });
});
