/**
 * Luban 配置表加载框架
 * 自动扫描 data/ 目录下的 JSON 文件，构建 Map 索引以支持按主键快速查询。
 *
 * 用法：
 *   const configManager = require('./config/luban/configManager');
 *   const item = configManager.tables.item_tbitem.get(10000);
 *   const allItems = configManager.tables.item_tbitem.getAll();
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../../utils/logger');

const DATA_DIR = path.join(__dirname, 'data');

class ConfigTable {
    constructor(name, dataList) {
        this.name = name;
        this.dataList = dataList;
        this.dataMap = new Map();
        this._indexKey = null;

        if (!Array.isArray(dataList) || dataList.length === 0) return;

        // 以第一个字段作为主键（Luban 表结构约定第一个字段为 index）
        this._indexKey = Object.keys(dataList[0])[0];
        for (const item of dataList) {
            this.dataMap.set(item[this._indexKey], item);
        }
    }

    /** 按主键获取单条记录，不存在返回 null */
    get(key) {
        return this.dataMap.get(key) || null;
    }

    /** 获取全部记录列表 */
    getAll() {
        return this.dataList;
    }

    /** 获取单例表数据（mode=one，仅一条记录），不存在返回 null */
    getData() {
        return this.dataList.length > 0 ? this.dataList[0] : null;
    }

    /** 记录总数 */
    get count() {
        return this.dataList.length;
    }
}

class ConfigManager {
    constructor() {
        this._tables = {};
        this._loaded = false;
    }

    /**
     * 加载所有配置表。
     * @param {string} [dataDir] 数据目录，默认为同级 data/ 目录
     */
    load(dataDir = DATA_DIR) {
        if (!fs.existsSync(dataDir)) {
            logger.warn(`[ConfigManager] data directory not found: ${dataDir}`);
            return this;
        }

        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const name = path.basename(file, '.json');
            const filePath = path.join(dataDir, file);
            try {
                const raw = fs.readFileSync(filePath, 'utf-8');
                this._tables[name] = new ConfigTable(name, JSON.parse(raw));
            } catch (e) {
                logger.error(`[ConfigManager] Failed to load table "${name}"`, { error: e.message });
            }
        }

        this._loaded = true;
        return this;
    }

    /** 所有已加载的表（key 为文件名，value 为 ConfigTable） */
    get tables() {
        return this._tables;
    }

    /** 是否已加载 */
    get loaded() {
        return this._loaded;
    }

    /** 已加载的表名列表 */
    get tableNames() {
        return Object.keys(this._tables);
    }
}

// 单例：require 时自动加载
const instance = new ConfigManager().load();
module.exports = instance;
