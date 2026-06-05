package com.afhome.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class LeaderboardWidgetProvider : AppWidgetProvider() {
    companion object {
        private const val TAG = "LeaderboardWidget"
        const val ACTION_UPDATE_WIDGET = "com.afhome.mobile.UPDATE_LEADERBOARD_WIDGET"
        const val ACTION_REFRESH = "com.afhome.mobile.REFRESH_LEADERBOARD_WIDGET"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        Log.d(TAG, "onUpdate called for widget IDs: ${appWidgetIds.joinToString()}")

        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_REFRESH -> {
                Log.d(TAG, "Refresh action received")
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, LeaderboardWidgetProvider::class.java)
                val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

                for (widgetId in widgetIds) {
                    updateWidget(context, appWidgetManager, widgetId)
                }
            }
            ACTION_UPDATE_WIDGET -> {
                Log.d(TAG, "Update widget action received")
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, LeaderboardWidgetProvider::class.java)
                val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

                for (widgetId in widgetIds) {
                    updateWidget(context, appWidgetManager, widgetId)
                }
            }
        }
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
        Log.d(TAG, "Updating widget: $widgetId")

        val views = RemoteViews(context.packageName, R.layout.widget_leaderboard)

        // Fetch real referral data from backend
        try {
            val referralData = LeaderboardWidgetService.getReferralData(context)
            Log.d(TAG, "Fetched ${referralData.size} referrers from backend")

            val dataToDisplay = if (referralData.isNotEmpty()) {
                referralData
            } else {
                Log.w(TAG, "No referral data received from backend - showing sample data")
                listOf(
                    Pair("Maria Garcia", 45),
                    Pair("Juan Dela Cruz", 96),
                    Pair("Ana Rodriguez", 72),
                    Pair("Carlos Santos", 28),
                    Pair("Rosa Fernandez", 24)
                )
            }

            // Display Top 3 with profile names and counts
            if (dataToDisplay.isNotEmpty()) {
                // Top 1 (1st place)
                if (dataToDisplay.size > 0) {
                    val (name1, count1) = dataToDisplay[0]
                    val initial1 = name1.firstOrNull()?.uppercaseChar().toString()
                    views.setTextViewText(context.resources.getIdentifier("avatar_1", "id", context.packageName), initial1)
                    views.setTextViewText(context.resources.getIdentifier("top_name_1", "id", context.packageName), name1)
                    views.setTextViewText(context.resources.getIdentifier("top_count_1", "id", context.packageName), "$count1")
                }

                // Top 2 (2nd place)
                if (dataToDisplay.size > 1) {
                    val (name2, count2) = dataToDisplay[1]
                    val initial2 = name2.firstOrNull()?.uppercaseChar().toString()
                    views.setTextViewText(context.resources.getIdentifier("avatar_2", "id", context.packageName), initial2)
                    views.setTextViewText(context.resources.getIdentifier("top_name_2", "id", context.packageName), name2)
                    views.setTextViewText(context.resources.getIdentifier("top_count_2", "id", context.packageName), "$count2")
                }

                // Top 3 (3rd place)
                if (dataToDisplay.size > 2) {
                    val (name3, count3) = dataToDisplay[2]
                    val initial3 = name3.firstOrNull()?.uppercaseChar().toString()
                    views.setTextViewText(context.resources.getIdentifier("avatar_3", "id", context.packageName), initial3)
                    views.setTextViewText(context.resources.getIdentifier("top_name_3", "id", context.packageName), name3)
                    views.setTextViewText(context.resources.getIdentifier("top_count_3", "id", context.packageName), "$count3")
                }

                // Display rest of rankings (4-5)
                for (i in 3..4) {
                    if (i < dataToDisplay.size) {
                        val (name, count) = dataToDisplay[i]
                        val userId = "user_${i + 1}"
                        val pointsId = "points_${i + 1}"

                        views.setTextViewText(
                            context.resources.getIdentifier(userId, "id", context.packageName),
                            name
                        )
                        views.setTextViewText(
                            context.resources.getIdentifier(pointsId, "id", context.packageName),
                            "$count referrals"
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading referral data: ${e.message}", e)
            // Show sample data on error
            val sampleData = listOf(
                Pair("Maria Garcia", 45),
                Pair("Juan Dela Cruz", 96),
                Pair("Ana Rodriguez", 72),
                Pair("Carlos Santos", 28),
                Pair("Rosa Fernandez", 24)
            )

            // Display Top 3
            if (sampleData.size > 0) views.setTextViewText(context.resources.getIdentifier("top_name_1", "id", context.packageName), sampleData[0].first)
            if (sampleData.size > 1) views.setTextViewText(context.resources.getIdentifier("top_name_2", "id", context.packageName), sampleData[1].first)
            if (sampleData.size > 2) views.setTextViewText(context.resources.getIdentifier("top_name_3", "id", context.packageName), sampleData[2].first)

            // Display rest
            for (i in 3..4) {
                if (i < sampleData.size) {
                    views.setTextViewText(context.resources.getIdentifier("user_${i + 1}", "id", context.packageName), sampleData[i].first)
                    views.setTextViewText(context.resources.getIdentifier("points_${i + 1}", "id", context.packageName), "${sampleData[i].second} referrals")
                }
            }
        }

        // Update the widget
        appWidgetManager.updateAppWidget(widgetId, views)

        Log.d(TAG, "Widget $widgetId updated successfully")
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        Log.d(TAG, "Widget enabled")
        scheduleWidgetUpdates(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        Log.d(TAG, "Widget disabled")
    }

    private fun scheduleWidgetUpdates(context: Context) {
        val updateWorkRequest = OneTimeWorkRequestBuilder<LeaderboardWidgetUpdateWorker>()
            .build()
        WorkManager.getInstance(context).enqueue(updateWorkRequest)
    }
}
