import { transformData, healthCheck } from './adapter.js';

async function runTests() {
  console.log('🧪 Testing AssemblyScript implementation...\n');
  
  try {
    // Test 1: Health check
    console.log('Test 1: Health check');
    const health = await healthCheck();
    const healthObj = JSON.parse(health);
    console.log('✅ Health:', healthObj);
    if (healthObj.status !== 'healthy') {
      throw new Error('Health check failed');
    }
    
    // Test 2: Simple object transformation
    console.log('\nTest 2: Simple object');
    const simple = await transformData('{"name":"test","value":42}');
    const simpleObj = JSON.parse(simple);
    console.log('✅ Simple:', simpleObj);
    if (simpleObj.original.name !== 'test' || simpleObj.original.value !== 42) {
      throw new Error('Simple object test failed');
    }
    
    // Test 3: Array transformation
    console.log('\nTest 3: Array');
    const array = await transformData('[1,2,3,"test"]');
    const arrayObj = JSON.parse(array);
    console.log('✅ Array:', arrayObj);
    if (!Array.isArray(arrayObj.original) || arrayObj.original.length !== 4) {
      throw new Error('Array test failed');
    }
    
    // Test 4: Nested object
    console.log('\nTest 4: Nested object');
    const nested = await transformData('{"user":{"id":1,"name":"John"},"meta":{"version":"1.0"}}');
    const nestedObj = JSON.parse(nested);
    console.log('✅ Nested:', nestedObj);
    if (nestedObj.original.user.name !== 'John') {
      throw new Error('Nested object test failed');
    }
    
    // Test 5: Invalid JSON
    console.log('\nTest 5: Invalid JSON');
    try {
      await transformData('invalid json {');
      throw new Error('Should have thrown on invalid JSON');
    } catch (error) {
      console.log('✅ Invalid JSON correctly rejected:', error.message);
    }
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests().catch(console.error);