from fastapi import FastAPI
from api import home # Import your new orchestration router

app = FastAPI()

app.include_router(home.router) # Include the router

'''
//TODO: delete comment
FastAPI app initialization, event handlers
'''