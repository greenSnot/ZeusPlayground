declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export = WebpackWorker;
}
declare interface ObjectConstructor {
  assign(target: any, ...sources: any[]): any;
}