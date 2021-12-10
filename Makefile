.PHONY:	build push dev prod-build prod-push prod

DEV_PREFIX = 351404365032.dkr.ecr.us-east-1.amazonaws.com
PROD_PREFIX = 351404365032.dkr.ecr.us-east-1.amazonaws.com

IMAGE = cardiac-patient-api

DEV_TAG = 0.4.23
PROD_TAG = 0.5.0

ENGINE_API_KEY=service:biocare-cardiac-bevm1:t9e9_ycD7yTj2JSQy1Kf1Q
SERVICE_NAME = patient-api
SERVICE_URL = http://cardiac-patient-api-service:6776

BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
HASH := $(shell git rev-parse HEAD)

build:
	docker build --pull -t $(DEV_PREFIX)/$(IMAGE):$(DEV_TAG) .

push:
	docker push $(DEV_PREFIX)/$(IMAGE):$(DEV_TAG)

dev:
	docker build --pull -t $(DEV_PREFIX)/$(IMAGE):$(DEV_TAG) .
	docker push $(DEV_PREFIX)/$(IMAGE):$(DEV_TAG)

prod-build:
	docker build --pull -t $(PROD_PREFIX)/$(IMAGE):$(PROD_TAG) .

prod-push:
	docker push $(PROD_PREFIX)/$(IMAGE):$(PROD_TAG)

prod:
	docker build --pull -t $(PROD_PREFIX)/$(IMAGE):$(PROD_TAG) .
	docker push $(PROD_PREFIX)/$(IMAGE):$(PROD_TAG)

apollo:
	apollo service:push --key=$(ENGINE_API_KEY) \
		--serviceName=$(SERVICE_NAME) \
		--serviceURL=$(SERVICE_URL) \
		--variant=$(BRANCH) \
		--endpoint=http://localhost:4002
