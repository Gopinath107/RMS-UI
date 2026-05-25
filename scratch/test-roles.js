import axios from 'axios';

async function test() {
  try {
    const response = await axios.get('http://localhost:8081/api/user-accounts/list');
    if (response.data.success) {
      console.log(JSON.stringify(response.data.result, null, 2));
    }
  } catch (error) {
    console.error(error.message);
  }
}

test();
