const {
  asClass, asValue, InjectionMode, Lifetime,
} = require('awilix');

const { Logger } = require('@dojot/microservice-sdk');

// create a scoped DI container
// https://github.com/jeffijoe/awilix#containercreatescope
module.exports = ({ DIContainer }) => ({
  name: 'scoped-di-interceptor',
  middleware: (req, res, next) => {
    req.scope = DIContainer.createScope();

    // register some request-specific data..
    req.scope.register({
      tenant: asValue(req.tenant),
    });
    req.scope.register({
      xRequestId: asValue(req.id),
    });
    req.scope.register({
      logger: asClass(Logger, {
        injectionMode: InjectionMode.CLASSIC,
        injector: () => ({ sid: `Certificate-ACL - Tenant:${req.tenant} - Request-Id:${req.id}` }),
        lifetime: Lifetime.SCOPED,
      }),
    });

    // This logger takes priority over the global logger within the DI container
    req.logger = req.scope.resolve('logger');

    next();
  },
});
