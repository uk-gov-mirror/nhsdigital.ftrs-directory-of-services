from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/Organization")
def organization():
    return {"Organization endpoint called"}

@app.get("_status")
def status():
    return "Ok"
