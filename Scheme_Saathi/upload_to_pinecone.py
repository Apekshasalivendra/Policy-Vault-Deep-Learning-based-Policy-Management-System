import os
import math
import pandas as pd
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

load_dotenv("../GOV-VAULT/.env")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_HOST = os.getenv("PINECONE_HOST")

print("Initializing Pinecone...")
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(name="scheme-data", host=PINECONE_HOST)

print("Loading embedding model...")
model = SentenceTransformer('BAAI/bge-large-en-v1.5')

print("Loading dataset...")
df = pd.read_csv("dataset.csv")

# Ensure scheme_id
if 'Unnamed: 0' in df.columns:
    df = df.rename(columns={'Unnamed: 0': 'scheme_id'})
elif 'scheme_id' not in df.columns:
    df['scheme_id'] = [f"SCH-{i}" for i in range(len(df))]

df = df.fillna('')

batch_size = 100
total_batches = math.ceil(len(df) / batch_size)

print(f"Uploading {len(df)} schemes to Pinecone in {total_batches} batches...")

for i in tqdm(range(0, len(df), batch_size)):
    batch_df = df.iloc[i:i+batch_size]
    
    upsert_data = []
    contents = []
    metadata_list = []
    ids = []
    
    for _, row in batch_df.iterrows():
        # Clean text
        name = str(row['scheme_name']).strip()
        tags = str(row['tags']).strip()
        state = str(row['state']).strip()
        category = str(row['category']).strip()
        elig = str(row['eligibility_criteria']).strip()
        desc = str(row['brief_description']).strip()
        scheme_id = str(row['scheme_id']).strip()
        
        # This matches the prompt from generate_query
        content = f"{name}. Tags: {tags}. State: {state}. Eligibility: {elig}."
        contents.append(content)
        ids.append(scheme_id)
        
        metadata_list.append({
            'scheme_id': scheme_id,
            'scheme_name': name,
            'brief_description': desc[:500], # limit size 
            'eligibility_criteria': elig[:500],
            'state': state,
            'tags': tags,
            'category': category
        })
        
    embeddings = model.encode(contents, normalize_embeddings=True).tolist()
    
    for scheme_id, emb, meta in zip(ids, embeddings, metadata_list):
        upsert_data.append((scheme_id, emb, meta))
        
    index.upsert(vectors=upsert_data)

print("Pinecone upload complete!")
