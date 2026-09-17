# CloudWatch: log groups for the app containers and an alarm on the instance.

resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = { Name = "${var.project_name}-${var.environment}-logs" }
}

# Dashboard summarising the app host.
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title  = "App CPU"
          region = var.aws_region
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.app.id]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "App host network"
          region = var.aws_region
          metrics = [
            ["AWS/EC2", "NetworkIn", "InstanceId", aws_instance.app.id],
            ["AWS/EC2", "NetworkOut", "InstanceId", aws_instance.app.id]
          ]
          period = 300
          stat   = "Sum"
        }
      }
    ]
  })
}

# Alarm if the instance is unhealthy for 10 minutes (covers stop/crash).
resource "aws_cloudwatch_metric_alarm" "instance_status" {
  alarm_name          = "${var.project_name}-${var.environment}-instance-status"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "App host failed EC2 status checks"
  dimensions          = { InstanceId = aws_instance.app.id }

  treat_missing_data = "notBreaching"
}
