# PH Bank Onboarding Portal — High-Level Architecture

```mermaid
graph TB
    subgraph Users["Users"]
        C["Customer - Browser"]
        A["Bank Officer - Browser"]
    end

    subgraph AWS["AWS Cloud - ap-southeast-1"]
        subgraph CDN["Content Delivery"]
            CF["Amazon CloudFront - CDN"]
            S3F["Amazon S3 - Static Frontend"]
        end

        subgraph Compute["Application Tier"]
            ALB["Application Load Balancer"]
            subgraph ECS["Amazon ECS Fargate"]
                BE1["Backend Container - Node.js 20 Express"]
                BE2["Backend Container - Auto-scaled Replica"]
            end
        end

        subgraph Data["Data Tier"]
            RDS["Amazon RDS - PostgreSQL 15 Multi-AZ"]
            S3D["Amazon S3 - Document Storage"]
        end

        subgraph Security["Security and Monitoring"]
            WAF["AWS WAF"]
            CW["Amazon CloudWatch - Logs and Metrics"]
            SM["AWS Secrets Manager"]
        end
    end

    C --> CF
    A --> CF
    CF --> S3F
    CF --> WAF
    WAF --> ALB
    ALB --> BE1
    ALB --> BE2
    BE1 --> RDS
    BE2 --> RDS
    BE1 --> S3D
    BE2 --> S3D
    BE1 --> SM
    BE2 --> SM
    BE1 --> CW
    BE2 --> CW
```

## Core Components

| Component | AWS Service | Purpose |
|-----------|-------------|--------|
| Frontend Hosting | S3 + CloudFront | Serve React SPA with global CDN caching |
| API Server | ECS Fargate + ALB | Run Node.js/Express containers, auto-scale, load balance |
| Database | RDS PostgreSQL 15 | Relational data — users, applications, steps, verification actions |
| Document Storage | S3 ap-southeast-1 | Store uploaded government IDs and proof-of-address documents |
| Secrets | Secrets Manager | JWT signing keys, DB credentials, AWS keys |
| Firewall | WAF | Rate limiting, SQL injection protection, bot mitigation |
| Observability | CloudWatch | Structured logs via Winston, metrics, alarms |
