#Build Image:

podman build -t sandbox-dos-search:0.0.1 .

#Run Container:

podman run -d --name dos-search-sandbox -p 9000:9000 sandbox-dos-search:0.0.1

#Invoke endpoint:

http://localhost/Organization
