import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as os from 'os';
import { RestClient } from 'typed-rest-client/RestClient';

interface Release {
  tag_name: string;
}

async function run() {
  try {
    const version = core.getInput('go-swagger-version');

    await getGoSwagger(version);

  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getGoSwagger(version: string) {

  version = await getVersion(version);

  core.info(`version: ${version}`);

  const path = await ensure(version);

  core.info(`path: ${path}`);

  core.addPath(path);
}

async function getVersion(version: string): Promise<string> {
  if (version) {
    return version;
  }

  return getLatestVersion();
}

async function getLatestVersion(): Promise<string> {
  const client = new RestClient('nodejs');
  const release = await client.get<Release>('https://api.github.com/repos/go-swagger/go-swagger/releases/latest');

  if (release.result) {
    return release.result.tag_name;
  }

  return '';
}

async function ensure(version: string): Promise<string> {
  const cachePath = tc.find('go-swagger', version);

  if (cachePath) {
    core.info(`cache found: ${cachePath}`);
    return cachePath;
  }

  const url = getUrl(version);
  core.info(`download from: ${url}`);

  const downloadPath = await tc.downloadTool(url);
  core.info(`downloaded to: ${downloadPath}`);

  const mode = '0755';
  core.info(`change ${downloadPath} mode to ${mode}`);
  fs.chmodSync(downloadPath, mode);

  const cacheSavePath = await tc.cacheFile(downloadPath, 'swagger', 'go-swagger', version);
  core.info(`cached to: ${cacheSavePath}`);

  return cacheSavePath;
}

function getUrl(version: string): string {
  const platform = getPlatform();
  const arch = getArch();

  return `https://github.com/go-swagger/go-swagger/releases/download/${version}/swagger_${platform}_${arch}`;
}

function getPlatform(): string {
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

function getArch(): string {
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
