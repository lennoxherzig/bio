# Deploying to Vercel

This project is ready for Vercel's Next.js preset. Import this directory or its Git repository into Vercel and keep the default build settings.

## Persistent view counter

Vercel Functions do not provide a persistent writable project filesystem. Connect an Upstash Redis database from **Vercel Dashboard → Storage/Marketplace → Upstash Redis** so the unique view counter survives deployments.

The integration should add these environment variables automatically:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The older `KV_REST_API_URL` and `KV_REST_API_TOKEN` names are also supported.

Add one more private environment variable in **Project Settings → Environment Variables**:

- `VIEW_HASH_SECRET`: a long random value used to hash visitor identifiers

Apply the variables to Production and Preview, then redeploy. Without Redis, the JSON counter remains available for ordinary local Node.js development.

## Deployment

1. Import the project into Vercel.
2. Select the Next.js framework preset if it is not detected automatically.
3. Connect Upstash Redis and add `VIEW_HASH_SECRET`.
4. Deploy. No custom build or output directory is required.
