package com.hexacolor.quest.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

interface IAdManager {
    fun loadRewardedAd(context: Context)
    fun showRewardedHint(activity: Activity, onRewardGranted: () -> Unit)
    fun notifyLevelCompleted(activity: Activity, levelId: Int, onComplete: () -> Unit)
}

class SafeAdManager : IAdManager {
    val REWARDED_TEST_ID = "ca-app-pub-3940256099942544/5224354917"
    val INTERSTITIAL_TEST_ID = "ca-app-pub-3940256099942544/1033173712"

    private var rewardedAd: RewardedAd? = null
    private var levelsSinceLastAd = 0

    override fun loadRewardedAd(context: Context) {
        val request = AdRequest.Builder().build()
        RewardedAd.load(context, REWARDED_TEST_ID, request, object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                rewardedAd = ad
            }
        })
    }

    override fun showRewardedHint(activity: Activity, onRewardGranted: () -> Unit) {
        val ad = rewardedAd
        if (ad != null) {
            ad.show(activity) { _ ->
                onRewardGranted()
                rewardedAd = null
                loadRewardedAd(activity)
            }
        } else {
            onRewardGranted()
            loadRewardedAd(activity)
        }
    }

    override fun notifyLevelCompleted(activity: Activity, levelId: Int, onComplete: () -> Unit) {
        levelsSinceLastAd++
        if (levelsSinceLastAd >= 4 && levelId > 2) {
            levelsSinceLastAd = 0
            onComplete()
        } else {
            onComplete()
        }
    }
}
