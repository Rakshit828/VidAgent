from typing import List, Dict

def format_docs(retrieved_docs: List[Dict]):
    context_text = "\n\n".join(dict_data['fields']['chunk_text'] for dict_data in retrieved_docs)
    print("\n \nThe formatted context is", context_text)
    return context_text



