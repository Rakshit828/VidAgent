def format_docs(retrieved_docs):
    context_text = "\n\n".join(doc.page_content for doc in retrieved_docs)
    print("\n \nThe formatted context is", context_text)
    return context_text



