import log from 'electron-log/main';

log.initialize();
log.transports.file.level = 'info';
log.transports.console.level = import.meta.env.DEV ? 'debug' : false;

export default log;
