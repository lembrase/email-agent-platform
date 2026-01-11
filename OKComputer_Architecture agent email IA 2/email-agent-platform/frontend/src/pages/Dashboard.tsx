import React from 'react'
import { Grid, Paper, Typography, Box } from '@mui/material'
import { useQuery } from 'react-query'
import {
  Email as EmailIcon,
  Description as DocumentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'

import { dashboardService } from '../services/dashboard.service'
import KPICard from '../components/dashboard/KPICard'
import DocumentChart from '../components/dashboard/DocumentChart'
import RecentActivity from '../components/dashboard/RecentActivity'
import LoadingSpinner from '../components/common/LoadingSpinner'

const Dashboard: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'dashboard-metrics',
    () => dashboardService.getMetrics(),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const { data: activity } = useQuery(
    'recent-activity',
    () => dashboardService.getRecentActivity(),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  )

  if (metricsLoading) {
    return <LoadingSpinner />
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Documents Today"
            value={metrics?.documentsToday || 0}
            trend={metrics?.documentsTrend}
            icon={<DocumentIcon />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Emails Analyzed"
            value={metrics?.emailsAnalyzed || 0}
            trend={metrics?.emailsTrend}
            icon={<EmailIcon />}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Classification Accuracy"
            value={`${metrics?.classificationAccuracy || 0}%`}
            trend={metrics?.accuracyTrend}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending Review"
            value={metrics?.pendingReview || 0}
            trend={metrics?.pendingTrend}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts and Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Document Processing Trends
            </Typography>
            {metrics?.chartData ? (
              <DocumentChart data={metrics.chartData} />
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="300px"
              >
                <Typography color="textSecondary">
                  No data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <RecentActivity activities={activity || []} />
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Email Accounts
            </Typography>
            <Typography variant="h3" color="primary">
              {metrics?.emailAccounts || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Active accounts
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Storage Used
            </Typography>
            <Typography variant="h3" color="secondary">
              {metrics?.storageUsed || 0} GB
            </Typography>
            <Typography variant="body2" color="textSecondary">
              of {metrics?.storageLimit || 100} GB
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard