// 测试医院信息刷新功能
// 使用方法: node test-hospital-refresh.js

async function testHospitalRefresh() {
  console.log('🧪 开始测试医院信息刷新功能...');

  try {
    // 启动后端服务（如果还没有启动的话）
    console.log('📡 检查后端服务是否运行在 http://localhost:8000...');

    // 测试API连接
    const healthResponse = await fetch('http://localhost:8000/health');
    if (!healthResponse.ok) {
      throw new Error('后端服务未运行，请先启动: python main.py');
    }
    console.log('✅ 后端服务运行正常');

    // 测试医院网站刷新API
    console.log('🔄 测试医院网站刷新API...');

    const testHospitalName = '广东省人民医院';
    console.log(`📋 测试医院: ${testHospitalName}`);

    const refreshResponse = await fetch('http://localhost:8000/hospital/website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hospital_name: testHospitalName,
        force_update: true
      })
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      throw new Error(`API请求失败: ${refreshResponse.status} - ${errorText}`);
    }

    const result = await refreshResponse.json();

    console.log('🎉 API响应成功!');
    console.log('📊 响应数据:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.data && result.data.website_info) {
      const websiteInfo = result.data.website_info;
      console.log('✨ 医院网站信息:');
      console.log(`   医院名称: ${websiteInfo.hospital_name}`);
      console.log(`   官网地址: ${websiteInfo.website || '未找到'}`);
      console.log(`   网站状态: ${websiteInfo.website_status || '未知'}`);
      console.log(`   可信度: ${websiteInfo.confidence || '未知'}`);
      console.log(`   响应时间: ${websiteInfo.llm_response_time || '未知'}秒`);
    } else {
      console.log('⚠️ 未返回网站信息');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 解决方案:');
    console.log('1. 确保后端服务已启动: python main.py');
    console.log('2. 确保端口8000未被占用');
    console.log('3. 检查.env文件中的LLM API配置');
    console.log('4. 确保有网络连接用于LLM API调用');
  }
}

// 运行测试
testHospitalRefresh();