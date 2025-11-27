#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const PORT = 3000;
const HOST = 'localhost';
const URL = `http://${HOST}:${PORT}`;

// 颜色输出函数
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查端口是否被占用
function checkPort(port) {
    return new Promise((resolve) => {
        const server = http.createServer();

        server.listen(port, () => {
            server.once('close', () => {
                resolve(false); // 端口未被占用
            });
            server.close();
        });

        server.on('error', () => {
            resolve(true); // 端口被占用
        });
    });
}

// 获取占用端口的进程ID（跨平台）
function findProcessOnPort(port) {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let command;

        if (platform === 'win32') {
            // Windows
            command = `netstat -ano | findstr :${port}`;
        } else {
            // macOS/Linux
            command = `lsof -ti:${port}`;
        }

        exec(command, (error, stdout, stderr) => {
            if (error) {
                if (stderr.includes('not found') || stderr.includes('not found')) {
                    resolve([]); // 没有找到进程
                    return;
                }
                reject(new Error(`命令执行失败: ${stderr}`));
                return;
            }

            const lines = stdout.trim().split('\n').filter(line => line.trim());
            const pids = [];

            if (platform === 'win32') {
                // Windows解析netstat输出
                lines.forEach(line => {
                    const match = line.match(/\s+(\d+)$/);
                    if (match) {
                        pids.push(parseInt(match[1]));
                    }
                });
            } else {
                // macOS/Linux直接获取PID
                lines.forEach(line => {
                    const pid = parseInt(line.trim());
                    if (!isNaN(pid)) {
                        pids.push(pid);
                    }
                });
            }

            resolve([...new Set(pids)]); // 去重
        });
    });
}

// 终止进程
function killProcess(pid) {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let command;

        if (platform === 'win32') {
            // Windows
            command = `taskkill /F /PID ${pid}`;
        } else {
            // macOS/Linux
            command = `kill -9 ${pid}`;
        }

        exec(command, (error, stdout, stderr) => {
            if (error) {
                log(`⚠️  终止进程 ${pid} 失败: ${stderr}`, 'yellow');
                resolve(false);
                return;
            }
            log(`✅ 成功终止进程 ${pid}`, 'green');
            resolve(true);
        });
    });
}

// 等待端口释放
async function waitForPortRelease(port, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const isOccupied = await checkPort(port);
        if (!isOccupied) {
            return true;
        }
        log(`⏳ 等待端口 ${port} 释放...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return false;
}

// 打开默认浏览器
function openBrowser(url) {
    const platform = os.platform();
    let command;

    switch (platform) {
        case 'win32':
            // Windows
            command = `start "" "${url}"`;
            break;
        case 'darwin':
            // macOS
            command = `open "${url}"`;
            break;
        default:
            // Linux
            command = `xdg-open "${url}"`;
            break;
    }

    exec(command, (error) => {
        if (error) {
            log(`⚠️  无法自动打开浏览器: ${error.message}`, 'yellow');
        } else {
            log(`🌐 已在默认浏览器中打开 ${url}`, 'blue');
        }
    });
}

// 等待服务启动
async function waitForServer(url, timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return true;
            }
        } catch (error) {
            // 服务还未启动，继续等待
        }

        log(`⏳ 等待服务启动...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return false;
}

// 主函数
async function main() {
    try {
        log('🚀 准备启动Next.js开发服务器...', 'cyan');
        log(`📡 目标端口: ${PORT}`, 'cyan');
        log(`🌐 服务地址: ${URL}`, 'cyan');

        // 检查端口是否被占用
        log(`🔍 检查端口 ${PORT}...`, 'yellow');
        const isPortOccupied = await checkPort(PORT);

        if (isPortOccupied) {
            log(`⚠️  端口 ${PORT} 被占用，正在查找占用进程...`, 'yellow');

            const pids = await findProcessOnPort(PORT);

            if (pids.length > 0) {
                log(`🎯 发现 ${pids.length} 个进程占用端口 ${PORT}: ${pids.join(', ')}`, 'yellow');

                // 终止所有占用端口的进程
                for (const pid of pids) {
                    await killProcess(pid);
                }

                // 等待端口释放
                log('⏳ 等待端口完全释放...', 'yellow');
                const portReleased = await waitForPortRelease(PORT);

                if (portReleased) {
                    log(`✅ 端口 ${PORT} 已成功释放`, 'green');
                } else {
                    log(`⚠️  端口 ${PORT} 释放超时，但仍尝试启动服务`, 'yellow');
                }
            } else {
                log(`ℹ️  端口 ${PORT} 显示被占用但未找到具体进程，继续启动...`, 'yellow');
            }
        } else {
            log(`✅ 端口 ${PORT} 当前未被占用`, 'green');
        }

        log('🎯 启动Next.js开发服务器...', 'cyan');

        // 启动Next.js开发服务器
        const nextProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true,
            cwd: path.resolve(__dirname, '..')
        });

        // 等待一段时间后尝试打开浏览器
        setTimeout(async () => {
            log('🔗 检查服务是否已启动...', 'yellow');

            const serverReady = await waitForServer(URL);

            if (serverReady) {
                log('🎉 服务启动成功！', 'green');
                log('🌐 正在打开默认浏览器...', 'blue');
                openBrowser(URL);
            } else {
                log('⚠️  服务启动检查超时，但进程仍在运行中...', 'yellow');
                log('🌐 仍尝试打开浏览器，请稍后手动刷新页面', 'yellow');
                openBrowser(URL);
            }
        }, 3000); // 3秒后开始检查

        // 处理进程退出
        nextProcess.on('close', (code) => {
            if (code !== 0) {
                log(`❌ Next.js进程退出，代码: ${code}`, 'red');
            } else {
                log('✅ Next.js进程正常退出', 'green');
            }
        });

        // 处理Ctrl+C
        process.on('SIGINT', () => {
            log('\n🛑 收到中断信号，正在关闭进程...', 'yellow');
            nextProcess.kill('SIGINT');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            log('\n🛑 收到终止信号，正在关闭进程...', 'yellow');
            nextProcess.kill('SIGTERM');
            process.exit(0);
        });

    } catch (error) {
        log(`❌ 启动过程中发生错误: ${error.message}`, 'red');
        process.exit(1);
    }
}

// 运行主函数
main();