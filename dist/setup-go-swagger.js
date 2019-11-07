"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const RestClient_1 = require("typed-rest-client/RestClient");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const version = core.getInput('go-swagger-version');
            yield getGoSwagger(version);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function getGoSwagger(version) {
    return __awaiter(this, void 0, void 0, function* () {
        version = yield getVersion(version);
        core.info(`version: ${version}`);
        const path = yield ensure(version);
        core.info(`path: ${path}`);
        core.addPath(path);
    });
}
function getVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (version) {
            return version;
        }
        return getLatestVersion();
    });
}
function getLatestVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new RestClient_1.RestClient('nodejs');
        const release = yield client.get('https://api.github.com/repos/go-swagger/go-swagger/releases/latest');
        if (release.result) {
            return release.result.tag_name;
        }
        return '';
    });
}
function ensure(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const cachePath = tc.find('go-swagger', version);
        if (cachePath) {
            core.info(`cache found: ${cachePath}`);
            return cachePath;
        }
        const url = getUrl(version);
        core.info(`download from: ${url}`);
        const downloadPath = yield tc.downloadTool(url);
        core.info(`downloaded to: ${downloadPath}`);
        const mode = '0755';
        core.info(`change ${downloadPath} mode to ${mode}`);
        fs.chmodSync(downloadPath, mode);
        const cacheSavePath = yield tc.cacheFile(downloadPath, 'swagger', 'go-swagger', version);
        core.info(`cached to: ${cacheSavePath}`);
        return cacheSavePath;
    });
}
function getUrl(version) {
    const platform = getPlatform();
    const arch = getArch();
    return `https://github.com/go-swagger/go-swagger/releases/download/${version}/swagger_${platform}_${arch}`;
}
function getPlatform() {
    const platform = os.platform();
    switch (platform) {
        case 'linux':
        case 'darwin':
            return platform;
        case 'win32':
            return 'windows';
        default:
            return platform;
    }
}
function getArch() {
    const arch = os.arch();
    switch (arch) {
        case 'x64':
            return 'amd64';
        case 'x32':
            return '386';
        default:
            return arch;
    }
}
run();
