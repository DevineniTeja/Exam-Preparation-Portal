output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.exam_prep_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.exam_prep_eip.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.exam_prep_server.public_dns
}

output "ssh_connection_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${local_file.private_key.filename} ubuntu@${aws_eip.exam_prep_eip.public_ip}"
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "http://${aws_eip.exam_prep_eip.public_ip}"
}

output "backend_api_url" {
  description = "Backend API URL"
  value       = "http://${aws_eip.exam_prep_eip.public_ip}:8000"
}

output "private_key_path" {
  description = "Path to the private key file"
  value       = local_file.private_key.filename
  sensitive   = true
}
