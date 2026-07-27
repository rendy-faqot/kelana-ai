import os
from urllib.parse import unquote, urlparse

import boto3


def _get_source_uri(location: dict) -> str | None:
    if not location:
        return None

    location_type = location.get("type")
    if not location_type:
        return None

    source = location.get(f"{location_type.lower()}Location", {})
    return source.get("uri") or source.get("url")


def _get_document_title(result: dict) -> str:
    metadata = result.get("metadata", {})

    for key in ("title", "document_title", "documentTitle", "file_name", "filename"):
        if metadata.get(key):
            return str(metadata[key])

    source_uri = _get_source_uri(result.get("location", {}))
    if source_uri:
        path = urlparse(source_uri).path
        filename = os.path.basename(unquote(path))
        if filename:
            return filename

    return "Untitled source"


def retrieve_and_generate(query: str) -> dict:
    region = os.getenv("AWS_REGION")
    knowledge_base_id = os.getenv("KNOWLEDGE_BASE_ID", "EW7EM5BPON")
    model_id = os.getenv("MODEL_ID") or os.getenv("KNOWLEDGE_BASE_MODEL_ARN")

    missing_env = [
        name for name, value in {
            "AWS_REGION": region,
            "MODEL_ID or KNOWLEDGE_BASE_MODEL_ARN": model_id,
        }.items()
        if not value
    ]

    if missing_env:
        raise RuntimeError(
            f"Missing required Knowledge Base environment variable(s): {', '.join(missing_env)}"
        )

    kb_client = boto3.client(
        "bedrock-agent-runtime",
        region_name=region,
    )
    bedrock_client = boto3.client(
        "bedrock-runtime",
        region_name=region,
    )

    retrieved = kb_client.retrieve(
        knowledgeBaseId=knowledge_base_id,
        retrievalQuery={
            "text": query,
        },
        retrievalConfiguration={
            "managedSearchConfiguration": {
                "numberOfResults": 5,
            },
        },
    )

    retrieval_results = retrieved.get("retrievalResults", [])
    chunks = []
    documents = []
    seen_documents = set()

    for result in retrieval_results:
        text = result.get("content", {}).get("text")
        if not text:
            continue

        chunks.append(text)
        title = _get_document_title(result)
        if title not in seen_documents:
            seen_documents.add(title)
            documents.append(title)

    context = "\n\n".join(chunks) or "No relevant knowledge base context found."
    prompt = (
        "Answer the question using the context below. "
        "Return the answer in markdown format.\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{query}"
    )

    response = bedrock_client.converse(
        modelId=model_id,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ],
    )

    return {
        "answer": response["output"]["message"]["content"][0]["text"],
        "documents": documents,
    }
