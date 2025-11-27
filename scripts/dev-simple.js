#!/usr/bin/env node

const { spawn } = require('child_process');
const killer = require('cross-port-killer');
const open = require('open');

const PORT = 3000;
const HOST = 'localhost';
const URL = `http://${HOST}:${PORT}`;

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    try {
        log('🚀 准备启动Next.js开发服务器...', 'cyan');
        log(`📡 目标端口: ${PORT}`, 'cyan');
        log(`🌐 服务地址: ${URL}`, 'cyan');

        // 检查并关闭占用端口的进程
        log(`🔍 检查并清理端口 ${PORT}...`, 'yellow');

        try {
            const killedPids = await killer(PORT);
            if (killedPids && killedPids.length > 0) {
                log(`✅ 已终止 ${killedPids.length} 个占用端口的进程: ${killedPids.join(', ')}`, 'green');
            } else {
                log(`✅ 端口 ${PORT} 当前未被占用`, 'green');
            }
        } catch (error) {
            log(`⚠️  端口检查时出现小问题，但继续启动: ${error.message}`, 'yellow');
        }

        // 等待一秒确保端口完全释放
        await new Promise(resolve => setTimeout(resolve, 1000));

        log('🎯 启动Next.js开发服务器...', 'cyan');

        // 启动Next.js开发服务器
        const nextProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true
        });

        // 等待服务启动后打开浏览器
        setTimeout(async () => {
            log('🌐 正在打开默认浏览器...', 'blue');

            try {
                await open(URL);
                log('✅ 浏览器已打开', 'green');
            } catch (error) {
                log(`⚠️  自动打开浏览器失败: ${error.message}`, 'yellow');
                log(`🌐 请手动访问: ${URL}`, 'blue');
            }
        }, 5000); // 5秒后打开浏览器

        // 处理进程退出
        nextProcess.on('close', (code) => {
            if (code !== 0) {
                log(`❌ Next.js进程退出，代码: ${code}`, 'red');
            } else {
                log('✅ Next.js进程正常退出', 'green');
            }
        });

        // 处理中断信号
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