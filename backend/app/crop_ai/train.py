"""
AGRI SMART — PyTorch Crop Disease Model Trainer
File: backend/app/crop_ai/train.py
"""

import os
import io
import time
import json
import zipfile
import random
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms

from app.crop_ai.model import AgriLeafCNN

ZIP_PATH = r"C:\AgriTech\archive.zip"
OUTPUT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "crop_model.pth")
CLASSES_PATH = os.path.join(os.path.dirname(__file__), "classes.json")

TARGET_CLASSES = [
    "Pepper__bell___Bacterial_spot",
    "Pepper__bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato__Target_Spot",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato__Tomato_mosaic_virus",
    "Tomato_healthy"
]

class ZipImageDataset(Dataset):
    def __init__(self, zip_path, samples, transform=None):
        self.zip_path = zip_path
        self.samples = samples  # list of (zip_inner_path, class_idx)
        self.transform = transform
        self._zip_file = None

    def _get_zip(self):
        if self._zip_file is None:
            self._zip_file = zipfile.ZipFile(self.zip_path, 'r')
        return self._zip_file

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        zf = self._get_zip()
        data = zf.read(path)
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label

def prepare_dataset(zip_path, max_per_class=100):
    class_to_idx = {cls: idx for idx, cls in enumerate(sorted(TARGET_CLASSES))}
    class_samples = {cls: [] for cls in TARGET_CLASSES}

    print("Indexing archive.zip contents...")
    with zipfile.ZipFile(zip_path, 'r') as z:
        for name in z.namelist():
            for cls in TARGET_CLASSES:
                if f"/{cls}/" in name or name.startswith(f"{cls}/"):
                    if name.lower().endswith(('.jpg', '.jpeg', '.png')):
                        class_samples[cls].append(name)
                    break

    train_samples = []
    val_samples = []

    random.seed(42)
    for cls, paths in class_samples.items():
        random.shuffle(paths)
        selected = paths[:max_per_class]
        split_idx = int(len(selected) * 0.8)
        c_idx = class_to_idx[cls]

        for p in selected[:split_idx]:
            train_samples.append((p, c_idx))
        for p in selected[split_idx:]:
            val_samples.append((p, c_idx))

        print(f"  [{cls}]: {len(selected[:split_idx])} train, {len(selected[split_idx:])} val")

    random.shuffle(train_samples)
    random.shuffle(val_samples)
    return train_samples, val_samples, class_to_idx

def train(epochs=8, batch_size=32, lr=0.0008):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Starting AgriLeafCNN training pipeline on device: {device}")

    train_samples, val_samples, class_to_idx = prepare_dataset(ZIP_PATH, max_per_class=100)

    # Save class mapping
    with open(CLASSES_PATH, "w") as f:
        json.dump(class_to_idx, f, indent=2)
    print(f"Saved class mapping ({len(class_to_idx)} classes) to {CLASSES_PATH}")

    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    train_dataset = ZipImageDataset(ZIP_PATH, train_samples, transform=train_transform)
    val_dataset = ZipImageDataset(ZIP_PATH, val_samples, transform=val_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    print(f"Total training samples: {len(train_dataset)}, Validation: {len(val_dataset)}")

    model = AgriLeafCNN(num_classes=len(class_to_idx)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_acc = 0.0

    for epoch in range(1, epochs + 1):
        start_t = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for i, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            if (i + 1) % 15 == 0 or (i + 1) == len(train_loader):
                print(f"  Epoch [{epoch}/{epochs}] Batch [{i+1}/{len(train_loader)}] Loss: {loss.item():.4f}")

        scheduler.step()
        train_loss = running_loss / total
        train_acc = 100.0 * correct / total

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_loss /= val_total
        val_acc = 100.0 * val_correct / val_total
        elapsed = time.time() - start_t

        print(f"\n--- Epoch [{epoch}/{epochs}] ({elapsed:.1f}s) ---")
        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.2f}%\n")

        if val_acc > best_acc or epoch == epochs:
            best_acc = max(best_acc, val_acc)
            torch.save(model.state_dict(), OUTPUT_MODEL_PATH)
            print(f"✓ Saved model weights to {OUTPUT_MODEL_PATH} (Best Val Accuracy: {best_acc:.2f}%)")

    print(f"\nTraining Complete! Peak Accuracy: {best_acc:.2f}%")
    print(f"Model successfully exported to: {OUTPUT_MODEL_PATH}")

if __name__ == "__main__":
    train(epochs=6, batch_size=32, lr=0.001)
