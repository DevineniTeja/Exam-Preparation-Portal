# Terraform EC2 Deployment for Exam Prep Application

This Terraform configuration provisions an EC2 instance on AWS for deploying the Exam Prep application.

## What It Creates

- **EC2 Instance**: t2.medium Ubuntu 22.04 server (configurable)
- **Security Group**: Opens ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (API), 5432 (PostgreSQL)
- **SSH Key Pair**: Automatically generates a PEM key for SSH access
- **Elastic IP**: Static public IP address
- **User Data**: Automatically installs Docker and Docker Compose on first boot

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```
3. **Terraform** installed ([Download here](https://www.terraform.io/downloads))

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Review the Plan (Optional)

```bash
# Copy example variables (optional)
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars if you want to customize region, instance type, etc.

# See what will be created
terraform plan
```

### 3. Deploy the Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 4. Get Connection Details

After successful deployment, Terraform will output:

```
instance_public_ip = "18.234.56.78"
ssh_connection_command = "ssh -i ./exam-prep-key.pem ubuntu@18.234.56.78"
frontend_url = "http://18.234.56.78"
backend_api_url = "http://18.234.56.78:8000"
```

### 5. Connect to Your EC2 Instance

```bash
# Use the SSH command from the output
ssh -i exam-prep-key.pem ubuntu@YOUR_PUBLIC_IP

# On Windows PowerShell/Git Bash, you might need:
ssh -i exam-prep-key.pem ubuntu@YOUR_PUBLIC_IP
```

### 6. Deploy the Application

Once connected to your EC2 instance:

```bash
cd ~/exam-assistant

# Create .env file
nano .env
# Add your ANTHROPIC_API_KEY and JWT_SECRET_KEY

# Pull and start containers
docker pull fayivor/exam-prep-backend:latest
docker pull fayivor/exam-prep-frontend:latest

# Use docker-compose from the repository
# Copy docker-compose.ec2.yml to the server and run:
docker-compose -f docker-compose.ec2.yml up -d
```

## Configuration Variables

Edit `terraform.tfvars` to customize:

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region to deploy to | `us-east-1` |
| `instance_type` | EC2 instance type | `t2.medium` |
| `volume_size` | Root volume size in GB | `30` |
| `ami_id` | Ubuntu 22.04 AMI ID | Auto-selected for region |

## Security Group Ports

| Port | Service | Access |
|------|---------|--------|
| 22 | SSH | 0.0.0.0/0 |
| 80 | HTTP (Frontend) | 0.0.0.0/0 |
| 443 | HTTPS | 0.0.0.0/0 |
| 8000 | Backend API | 0.0.0.0/0 |
| 5432 | PostgreSQL | 0.0.0.0/0 |

## Managing Your Infrastructure

### View Current State

```bash
terraform show
```

### Get Outputs Again

```bash
terraform output
```

### Update Infrastructure

After modifying .tf files:

```bash
terraform plan
terraform apply
```

### Destroy Infrastructure

**Warning**: This will delete everything!

```bash
terraform destroy
```

## Cost Estimation

Approximate monthly costs (us-east-1):

- **t2.medium instance**: ~$34/month (running 24/7)
- **30 GB EBS storage**: ~$3/month
- **Elastic IP**: Free (while attached to running instance)
- **Data transfer**: Variable based on usage

**Total**: ~$37-40/month

### Cost Saving Tips

1. **Stop instance when not in use**:
   ```bash
   aws ec2 stop-instances --instance-ids $(terraform output -raw instance_id)
   ```

2. **Use smaller instance**:
   - Change `instance_type = "t2.small"` (~$17/month)

3. **Use reserved instances** for long-term deployments

## Troubleshooting

### Permission Denied (SSH Key)

```bash
# On Linux/Mac
chmod 400 exam-prep-key.pem

# On Windows (PowerShell as Administrator)
icacls exam-prep-key.pem /inheritance:r
icacls exam-prep-key.pem /grant:r "$env:USERNAME:R"
```

### AMI Not Found

Update the `ami_id` in `terraform.tfvars` with the correct Ubuntu 22.04 AMI for your region.

Find AMI IDs here: https://cloud-images.ubuntu.com/locator/ec2/

### Connection Timeout

1. Check security group rules
2. Verify instance is running: `terraform show`
3. Check AWS console for instance status

## Files Generated

- `exam-prep-key.pem` - **Private SSH key** (DO NOT commit to git - already in .gitignore)
- `terraform.tfstate` - **Terraform state file** (DO NOT commit to git)
- `.terraform/` - Terraform plugins and modules

## Security Notes

⚠️ **Important Security Considerations**:

1. The security group allows access from anywhere (0.0.0.0/0) for ease of setup
2. For production, restrict SSH access to your IP:
   ```hcl
   cidr_blocks = ["YOUR_IP/32"]  # Replace YOUR_IP
   ```
3. Keep your PEM key secure and never commit it to git
4. Regularly update the OS: `sudo apt update && sudo apt upgrade`
5. Consider using AWS Systems Manager Session Manager instead of SSH
6. Enable CloudWatch monitoring for the instance

## Next Steps

After infrastructure is provisioned:

1. SSH into the instance
2. Deploy the Docker containers (see [EC2_QUICK_START.md](../EC2_QUICK_START.md))
3. Configure DNS (optional) to point a domain to the Elastic IP
4. Set up SSL/TLS certificate (optional, for HTTPS)

## Support

For issues with:
- **Terraform**: Check [Terraform AWS Provider docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- **Application deployment**: See [EC2_QUICK_START.md](../EC2_QUICK_START.md)
