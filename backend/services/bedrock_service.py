import os
import boto3

def _configure_bedrock_api_key():
    api_key = os.getenv("AWS_BEARER_TOKEN_BEDROCK") or os.getenv("BEDROCK_API_KEY")

    if api_key:
        os.environ["AWS_BEARER_TOKEN_BEDROCK"] = api_key

    print(f"Bedrock API key configured: {bool(api_key)}")


def get_ai_recommendation(request):
    region = os.getenv("AWS_REGION")
    model_id = os.getenv("MODEL_ID")
    _configure_bedrock_api_key()
    print(f"Using Bedrock model ID: {model_id} in region: {region}")

    missing_env = [
        name for name, value in {
            "AWS_REGION": region,
            "MODEL_ID": model_id,
        }.items()
        if not value
    ]

    if missing_env:
        raise RuntimeError(
            f"Missing required Bedrock environment variable(s): {', '.join(missing_env)}"
        )

    client = boto3.client(
        "bedrock-runtime",
        region_name=region
    )

    prompt = f"Plan a {request.days}-day trip to {request.destination} with a budget of {request.budget} IDR and a travel style of {request.travel_style}. Give the answer with markdown format."

    # model_id = "arn:aws:bedrock:ap-southeast-2:837933860729:inference-profile/global.amazon.nova-2-lite-v1:0"
    response = client.converse(
        modelId=model_id,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    )

    return response["output"]["message"]["content"][0]["text"]
