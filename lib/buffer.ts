/**
 * Buffer GraphQL API Client
 * Official Endpoint: https://api.buffer.com
 */

export interface BufferOrganization {
  id: string;
  name: string;
}

export interface BufferChannel {
  id: string;
  name: string;
  displayName?: string;
  service: string; // e.g., 'twitter', 'linkedin', 'facebook', 'instagram', 'threads', 'pinterest'
  avatar?: string;
  isQueuePaused?: boolean;
}

export interface BufferPostResult {
  success: boolean;
  postId?: string;
  dueAt?: string;
  status?: string;
  errorMessage?: string;
}

const BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com";

export class BufferClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken.trim();
  }

  private async executeGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Buffer API HTTP error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    if (data.errors && data.errors.length > 0) {
      const errMsgs = data.errors.map((e: { message: string }) => e.message).join(", ");
      throw new Error(`Buffer API GraphQL error: ${errMsgs}`);
    }

    return data.data as T;
  }

  /**
   * Fetch user account and associated organizations
   */
  async getOrganizations(): Promise<BufferOrganization[]> {
    const query = `
      query GetOrganizations {
        account {
          organizations {
            id
            name
          }
        }
      }
    `;

    try {
      const data = await this.executeGraphQL<{
        account: { organizations: BufferOrganization[] };
      }>(query);

      return data?.account?.organizations || [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch Buffer organizations: ${msg}`);
    }
  }

  /**
   * Fetch connected channels for an organization
   */
  async getChannels(organizationId: string): Promise<BufferChannel[]> {
    const query = `
      query GetChannels($input: ChannelsInput!) {
        channels(input: $input) {
          id
          name
          displayName
          service
          avatar
          isQueuePaused
        }
      }
    `;

    try {
      const data = await this.executeGraphQL<{
        channels: BufferChannel[];
      }>(query, {
        input: { organizationId },
      });

      return data?.channels || [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch Buffer channels: ${msg}`);
    }
  }

  /**
   * Fetch all channels across all organizations for the authenticated user
   */
  async getAllChannels(): Promise<{ organizations: BufferOrganization[]; channels: BufferChannel[] }> {
    const orgs = await this.getOrganizations();
    if (!orgs || orgs.length === 0) {
      return { organizations: [], channels: [] };
    }

    const allChannels: BufferChannel[] = [];
    for (const org of orgs) {
      try {
        const channels = await this.getChannels(org.id);
        allChannels.push(...channels);
      } catch (err) {
        console.warn(`Could not fetch channels for org ${org.id}:`, err);
      }
    }

    return { organizations: orgs, channels: allChannels };
  }

  /**
   * Create a post (or draft) in Buffer for a given channel
   */
  async createPost(params: {
    channelId: string;
    text: string;
    saveToDraft?: boolean;
    mode?: "addToQueue" | "shareNow" | "shareNext";
    dueAt?: string;
  }): Promise<BufferPostResult> {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            post {
              id
              dueAt
              status
            }
          }
          ... on MutationError {
            message
          }
        }
      }
    `;

    const input: Record<string, unknown> = {
      channelId: params.channelId,
      text: params.text,
      schedulingType: "automatic",
      mode: params.mode || "addToQueue",
      saveToDraft: params.saveToDraft ?? true,
    };

    if (params.dueAt) {
      input.dueAt = params.dueAt;
    }

    try {
      const data = await this.executeGraphQL<{
        createPost: {
          post?: {
            id: string;
            dueAt?: string;
            status: string;
          };
          message?: string;
        };
      }>(mutation, { input });

      const result = data?.createPost;

      if (result?.post?.id) {
        return {
          success: true,
          postId: result.post.id,
          dueAt: result.post.dueAt,
          status: result.post.status,
        };
      }

      return {
        success: false,
        errorMessage: result?.message || "Unknown error creating Buffer post",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        errorMessage: msg,
      };
    }
  }
}
