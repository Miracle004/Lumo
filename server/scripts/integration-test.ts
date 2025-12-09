import axios from 'axios'; // Removed AxiosInstance from import
// import { Agent } from 'http';

// Helper to create an Axios instance that manages cookies
const createAuthenticatedAgent = (): any => { // Type changed to any
    const instance: any = axios.create({ // Explicitly cast to any
        baseURL: 'http://localhost:3000', // Assuming your server runs on port 3000
        withCredentials: true, // Crucial for sending/receiving cookies
        validateStatus: () => true, // Resolve all status codes to handle errors manually
    });

    // Simple cookie management (not robust for all scenarios but works for basic tests)
    let cookieJar: string = '';
    instance.interceptors.response.use((response: any) => { // Added any for response
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            cookieJar = setCookie.map((cookie: string) => cookie.split(';')[0]).join('; ');
        }
        return response;
    });

    instance.interceptors.request.use((request: any) => { // Added any for request
        if (cookieJar) {
            request.headers = request.headers || {}; // Initialize headers if undefined
            request.headers['Cookie'] = cookieJar;
        }
        return request;
    });

    return instance;
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const runTests = async () => {
    console.log('Waiting for server to start (5 seconds)...');
    await delay(5000); // Wait for 5 seconds

    const agent1 = createAuthenticatedAgent();
    const agent2 = createAuthenticatedAgent();
    const agentGuest = createAuthenticatedAgent(); // For public routes

    const timestamp = Date.now();
    const user1 = { username: `user${timestamp}_1`, email: `user${timestamp}_1@example.com`, password: 'password1234' };
    const user2 = { username: `user${timestamp}_2`, email: `user${timestamp}_2@example.com`, password: 'password12345' };

    let post1Id: string | null = null;

    console.log('--- Starting Backend Integration Tests ---');

    // --- User 3: Signup and Login ---
    console.log('\n--- User 3: Signup ---');
    let res = await agent1.post('/user/signup', user1);
    console.log('User 3 Signup:', res.status, res.data);
    if (res.status !== 201 && res.status !== 409) return console.error('FAIL: User 3 Signup');

    console.log('\n--- User 3: Login ---');
    res = await agent1.post('/user/login', { username: user1.username, password: user1.password });
    console.log('User 3 Login:', res.status, res.data);
    if (res.status !== 200 || !res.data.success) return console.error('FAIL: User 3 Login');

    // --- User 4: Signup and Login ---
    console.log('\n--- User 4: Signup ---');
    res = await agent2.post('/user/signup', user2);
    console.log('User 4 Signup:', res.status, res.data);
    if (res.status !== 201 && res.status !== 409) return console.error('FAIL: User 4 Signup');

    console.log('\n--- User 4: Login ---');
    res = await agent2.post('/user/login', { username: user2.username, password: user2.password });
    console.log('User 4 Login:', res.status, res.data);
    if (res.status !== 200 || !res.data.success) return console.error('FAIL: User 4 Login');

    // --- User 3: Create Draft ---
    console.log('\n--- User 3: Create Draft ---');
    res = await agent1.post('/api/posts/create', { title: 'My First Draft 3', content: { text: 'Just testing the draft as user 3.' } });
    console.log('User 3 Create Draft:', res.status, res.data);
    if (res.status === 201 && res.data.id) {
        post1Id = res.data.id;
    } else {
        return console.error('FAIL: User 3 Create Draft');
    }

    // --- User 3: Get Drafts ---
    console.log('\n--- User 3: Get Drafts ---');
    res = await agent1.get('/api/posts/drafts');
    console.log('User 3 Get Drafts:', res.status, res.data);
    if (res.status !== 200 || !res.data.myDrafts.some((p: any) => p.id === post1Id)) {
        return console.error('FAIL: User 3 Get Drafts');
    }

    // --- User 4: Try to Get User 3's Draft (should fail) ---
    console.log('\n--- User 4: Try to Get User 3\'s Draft (should fail 403) ---');
    res = await agent2.get(`/api/posts/${post1Id}`);
    console.log('User 4 Get User 3 Draft:', res.status, res.data);
    if (res.status !== 403) return console.error('FAIL: User 4 tried to get User 3 draft, expected 403');

    // --- User 3: Share Draft with User 4 ---
    console.log('\n--- User 3: Share Draft with User 4 ---');
    res = await agent1.post(`/api/posts/${post1Id}/share`, { emails: [user2.email], permission: 'edit' });
    console.log('User 3 Share Draft:', res.status, res.data);
    if (res.status !== 200 || !res.data.added.length) return console.error('FAIL: User 3 Share Draft');

    // --- User 4: Get Drafts (should now include shared) ---
    console.log('\n--- User 4: Get Drafts (should include shared) ---');
    res = await agent2.get('/api/posts/drafts');
    console.log('User 4 Get Drafts:', res.status, res.data);
    if (res.status !== 200 || !res.data.sharedWithMe.some((p: any) => p.id === post1Id)) {
        return console.error('FAIL: User 4 Get Shared Drafts');
    }

    // --- User 4: Edit Shared Draft ---
    console.log('\n--- User 4: Edit Shared Draft ---');
    res = await agent2.put(`/api/posts/${post1Id}`, { content: { text: 'User 4 updated this content.' } });
    console.log('User 4 Edit Shared Draft:', res.status, res.data);
    if (res.status !== 200 || res.data.content.text !== 'User 4 updated this content.') {
        return console.error('FAIL: User 4 Edit Shared Draft');
    }

    // --- User 3: Publish Draft ---
    console.log('\n--- User 3: Publish Draft ---');
    res = await agent1.post(`/api/posts/${post1Id}/publish`);
    console.log('User 3 Publish Draft:', res.status, res.data);
    if (res.status !== 200 || res.data.status !== 'published') return console.error('FAIL: User 3 Publish Draft');

    // --- Guest: Get Published Posts ---
    console.log('\n--- Guest: Get Published Posts ---');
    res = await agentGuest.get('/api/posts/published');
    console.log('Guest Get Published Posts:', res.status, res.data);
    if (res.status !== 200 || !res.data.some((p: any) => p.id === post1Id)) {
        return console.error('FAIL: Guest Get Published Posts');
    }

    // --- User 3: Remove Collaborator (User 4) ---
    console.log('\n--- User 3: Remove Collaborator (User 4) ---');
    // Need user2's ID
    const collaboratorsRes = await agent1.get(`/api/posts/${post1Id}/collaborators`);
    const user2Collaborator = collaboratorsRes.data.collaborators.find((c: any) => c.email === user2.email);
    if (!user2Collaborator) return console.error('FAIL: Could not find User 4 as collaborator to remove');

    res = await agent1.delete(`/api/posts/${post1Id}/collaborators/${user2Collaborator.user_id}`);
    console.log('User 3 Remove Collaborator:', res.status, res.data);
    if (res.status !== 200 || !res.data.success) return console.error('FAIL: User 3 Remove Collaborator');

    console.log('\n--- Backend Integration Tests Completed Successfully! ---');
};

runTests().catch(console.error);