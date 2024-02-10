const Transport = require('winston-transport')
const { struct } = require('pb-util')
const { MESSAGE } = require('triple-beam')
const { YCLogClient } = require('@1xtr/yc-log-client')

/**
 * @typedef {Object} YCLogServiceOptions
 * @property {string | undefined} [folderId=undefined] folderId
 * @property {string | undefined} [logGroupId=undefined] logGroupId
 * @property {string | undefined} [streamName=undefined] streamName
 * @property {string | undefined} [resourceType=undefined] resourceType
 * @property {string | undefined} [resourceId=undefined] resourceId
 */

class YCLoggingTransport extends Transport {
  /**
   * @param {YCLogServiceOptions} opts
   */
  constructor(opts) {
    super(opts)

    if (!opts.folderId && !opts.logGroupId) {
      throw new Error('folderId or logGroupId is required')
    }

    this.folderId = opts.folderId
    this.logGroupId = opts.logGroupId
    this.streamName = opts.streamName
    this.resourceType = opts.resourceType
    this.resourceId = opts.resourceId

    this.YCLogger = new YCLogClient()
  }

  async log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    if (!this.YCLogger.ready) {
      console.log('Token expired')
      await this.YCLogger.init()
    }

    let meta = {}

    if (info[MESSAGE]) {
      try {
        meta = JSON.parse(info[MESSAGE])
      } catch (error) {
        console.log('error json parse')
      }
    }

    let level = info.level.toUpperCase()

    if (['verbose', 'http', 'silly'].includes(info.level)) {
      level = 'TRACE'
    }

    const timestamp = info.timestamp ? Number(info.timestamp) : Date.now()

    const writeRequest = {
      destination: {
        // folder_id: undefined, // highest priority than logGroupId
        // log_group_id: undefined,
      },
      resource: {
        // type: undefined,
        // id: undefined,
      },
      defaults: {
        // stream_name: undefined,
        // json_payload: undefined,
      },
      entries: [],
    }

    if (this.folderId) {
      writeRequest.destination.folder_id = this.folderId
    } else if (this.logGroupId) {
      writeRequest.destination.log_group_id = this.logGroupId
    }
    if (this.streamName) {
      writeRequest.defaults.stream_name = this.streamName
    }
    if (this.resourceType) {
      writeRequest.resource.type = this.resourceType
    }
    if (this.resourceId) {
      writeRequest.resource.id = this.resourceId
    }

    writeRequest.entries.push({
      level,
      timestamp: {
        seconds: Math.trunc(timestamp / 1000),
        nanos: (timestamp % 1000) * 1e6,
      },
      message: info.message || info.msg || 'Empty message',
      json_payload: struct.encode(meta),
    })

    this.YCLogger.write(writeRequest)

    callback()
  }
}

module.exports = { YCLoggingTransport }
