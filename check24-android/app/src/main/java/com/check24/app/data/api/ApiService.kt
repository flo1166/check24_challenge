package com.check24.app.data.api

import com.check24.app.data.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*

class ApiService(private val client: HttpClient) {
    
    // Change this to your computer's local IP address when testing on a real device
    // For emulator: use 10.0.2.2
    // For real device: use your computer's IP (e.g., 192.168.1.100)
    private val baseUrl = "http://10.0.2.2:8000"
    
    suspend fun getHomeData(): Result<HomeResponse> {
        return try {
            val response: HomeResponse = client.get("$baseUrl/home").body()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getUserContracts(userId: Int): Result<ContractsResponse> {
        return try {
            val response: ContractsResponse = client.get("$baseUrl/user/$userId/contracts").body()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createContract(
        serviceKey: String,
        request: CreateContractRequest,
        port: Int
    ): Result<CreateContractResponse> {
        return try {
            val apiUrl = "http://10.0.2.2:$port/widget/$serviceKey/contract"
            val response: CreateContractResponse = client.post(apiUrl) {
                contentType(ContentType.Application.Json)
                setBody(request)
            }.body()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
