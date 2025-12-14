package com.check24.app.data.repository

import com.check24.app.data.api.ApiService
import com.check24.app.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class Check24Repository(private val apiService: ApiService) {
    
    fun getHomeData(): Flow<Result<HomeResponse>> = flow {
        emit(apiService.getHomeData())
    }
    
    fun getUserContracts(userId: Int): Flow<Result<ContractsResponse>> = flow {
        emit(apiService.getUserContracts(userId))
    }
    
    suspend fun createContract(
        serviceKey: String,
        userId: Int,
        widgetId: String
    ): Result<CreateContractResponse> {
        val port = getPortForService(serviceKey)
        val request = CreateContractRequest(userId, widgetId)
        return apiService.createContract(serviceKey, request, port)
    }
    
    private fun getPortForService(serviceKey: String): Int {
        return when (serviceKey) {
            "car_insurance" -> 8001
            "health_insurance" -> 8002
            "house_insurance" -> 8003
            "banking" -> 8004
            else -> 8000
        }
    }
}
