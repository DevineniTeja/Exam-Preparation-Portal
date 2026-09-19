terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Create a key pair for SSH access
resource "tls_private_key" "exam_prep_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "exam_prep_key" {
  key_name   = "exam-prep-key"
  public_key = tls_private_key.exam_prep_key.public_key_openssh
}

# Save the private key locally
resource "local_file" "private_key" {
  content         = tls_private_key.exam_prep_key.private_key_pem
  filename        = "${path.module}/exam-prep-key.pem"
  file_permission = "0400"
}

# Security Group
resource "aws_security_group" "exam_prep_sg" {
  name        = "exam-prep-security-group"
  description = "Security group for Exam Prep application"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access for frontend"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # Backend API
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Backend API access"
  }

  # PostgreSQL (if needed for external access)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "PostgreSQL access"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "exam-prep-sg"
  }
}

# EC2 Instance
resource "aws_instance" "exam_prep_server" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = aws_key_pair.exam_prep_key.key_name

  vpc_security_group_ids = [aws_security_group.exam_prep_sg.id]

  root_block_device {
    volume_size = var.volume_size
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              # Update system
              apt-get update
              apt-get upgrade -y

              # Install Docker
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh

              # Add ubuntu user to docker group
              usermod -aG docker ubuntu

              # Install Docker Compose
              apt-get install -y docker-compose

              # Create application directory
              mkdir -p /home/ubuntu/exam-assistant
              chown ubuntu:ubuntu /home/ubuntu/exam-assistant
              EOF

  tags = {
    Name = "exam-prep-server"
  }
}

# Elastic IP (optional but recommended)
resource "aws_eip" "exam_prep_eip" {
  instance = aws_instance.exam_prep_server.id
  domain   = "vpc"

  tags = {
    Name = "exam-prep-eip"
  }
}
