package com.afhome.mobile

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class MyOrdersWidgetUpdateWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {
    companion object {
        private const val TAG = "MyOrdersWidgetUpdateWorker"
    }

    override fun doWork(): Result {
        return try {
            Log.d(TAG, "Background work started")

            val context = applicationContext
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, MyOrdersWidgetProvider::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

            if (widgetIds.isNotEmpty()) {
                Log.d(TAG, "Updating ${widgetIds.size} widgets")
                val intent = Intent(context, MyOrdersWidgetProvider::class.java)
                intent.action = MyOrdersWidgetProvider.ACTION_UPDATE_WIDGET
                intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                context.sendBroadcast(intent)

                Result.success()
            } else {
                Log.d(TAG, "No widgets found to update")
                Result.success()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in background work: ${e.message}", e)
            Result.retry()
        }
    }
}
