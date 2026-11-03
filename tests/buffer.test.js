const test = require("node:test");
const assert = require("node:assert");

class MockBufferClient {
  constructor(token) {
    this.token = token;
  }

  async getOrganizations() {
    if (!this.token || this.token === "invalid") {
      throw new Error("Invalid Buffer access token");
    }
    return [{ id: "org_123", name: "Podloom Studio" }];
  }

  async getChannels(orgId) {
    if (orgId !== "org_123") return [];
    return [
      {
        id: "ch_twitter_1",
        name: "Podloom Official",
        displayName: "@podloom",
        service: "twitter",
      },
      {
        id: "ch_linkedin_1",
        name: "Podloom Company",
        displayName: "Podloom Inc",
        service: "linkedin",
      },
    ];
  }

  async createPost(params) {
    if (!params.channelId) {
      return { success: false, errorMessage: "channelId is required" };
    }
    if (!params.text || params.text.trim().length === 0) {
      return { success: false, errorMessage: "text is required" };
    }
    return {
      success: true,
      postId: `post_${Date.now()}`,
      status: params.saveToDraft ? "draft" : "buffer",
    };
  }
}

test("Buffer GraphQL Client Logic", async (t) => {
  await t.test("successfully retrieves organizations and channels", async () => {
    const client = new MockBufferClient("valid_buffer_token_123");
    const orgs = await client.getOrganizations();
    assert.strictEqual(orgs.length, 1);
    assert.strictEqual(orgs[0].id, "org_123");

    const channels = await client.getChannels(orgs[0].id);
    assert.strictEqual(channels.length, 2);
    assert.strictEqual(channels[0].service, "twitter");
    assert.strictEqual(channels[1].service, "linkedin");
  });

  await t.test("throws error when token is invalid", async () => {
    const client = new MockBufferClient("invalid");
    await assert.rejects(async () => {
      await client.getOrganizations();
    }, /Invalid Buffer access token/);
  });

  await t.test("creates a draft post targeting a specific channel", async () => {
    const client = new MockBufferClient("valid_buffer_token_123");
    const result = await client.createPost({
      channelId: "ch_twitter_1",
      text: "New podcast episode is out! 🎙️ #AI #Podcasting",
      saveToDraft: true,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, "draft");
    assert.match(result.postId, /^post_\d+$/);
  });

  await t.test("fails gracefully when required fields are missing", async () => {
    const client = new MockBufferClient("valid_buffer_token_123");
    const result = await client.createPost({
      channelId: "",
      text: "Sample post",
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.errorMessage, "channelId is required");
  });
});
