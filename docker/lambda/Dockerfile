FROM public.ecr.aws/sam/build-nodejs22.x:latest

WORKDIR /app

RUN pip3 install --upgrade aws-sam-cli

RUN npm install -g typescript ts-node nodemon

COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD ["sam", "local", "start-api", "--host", "0.0.0.0", "--port", "3000", "--warm-containers", "EAGER"]
