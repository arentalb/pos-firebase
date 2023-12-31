import {Injectable} from '@angular/core';
import {createRxDatabase, RxCollection, RxDatabase, RxDocument} from 'rxdb';
import {getRxStorageDexie} from 'rxdb/plugins/storage-dexie';
import {RxDBMigrationPlugin} from 'rxdb/plugins/migration';
import {Product} from "../models/product";
// import {RxDBDevModePlugin} from "rxdb/dist/types/plugins/dev-mode";
// addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBAttachmentsPlugin);
import { addRxPlugin } from 'rxdb';
import {RxAttachment, RxDBAttachmentsPlugin} from 'rxdb/plugins/attachments';
import {ImageService} from "./image.service";
addRxPlugin(RxDBAttachmentsPlugin);
@Injectable({
  providedIn: 'root',
})
export class RxDBService {
  mySchema = {
    title: 'product',
    version: 1,
    description: 'describes a product',
    primaryKey: "key",
    type: 'object',
    properties: {
      key: {
        type: 'string',
        maxLength: 100
      },
      name: {
        type: 'string',
      },
      basePrice: {
        type: 'number',
      },
      salePrice: {
        type: 'number',
      },
      quantity: {
        type: 'number',
      },
      image: {
        type: 'string',
      },
      imageUrl: {
        type: 'string',
      },
      category: {
        type: 'string',
        enum: [
          'Groceries',
          'Meat and Seafood',
          'Bakery',
          'Frozen Foods',
          'Cleaning Supplies',
          'Electronics',
          'Toys',
          'Other',
        ],
      },
      sellQuantity: {
        type: 'number',
      },

    },
    attachments: {
      encrypted: false,
    },
    required: [
      'name',
      'basePrice',
      'salePrice',
      'quantity',
      'category',
      'sellQuantity',
    ],
  };


  private myDatabase: RxDatabase | null = null; // Store the database instance

  constructor(private imageService: ImageService) {
    this.initDatabase().then((result) => {
      this.myDatabase = result; // Save the database instance
      console.log('Database created:', result);
      // to insert initial object for testing
      // this.insertSampleObject(result).then(()=>{
      //
      // });
    });

  }

  private async initDatabase(): Promise<RxDatabase> {
    const myDatabase = await createRxDatabase({
      name: 'mydatabase',
      storage: getRxStorageDexie(),
    });

    await myDatabase.addCollections({
      products: {
        schema: this.mySchema,
      },
      syncProducts: {
        schema: this.mySchema,
      },
    });

    return myDatabase;
  }

  async saveProducts(products: Product[]): Promise<void> {

    // console.log("in rxDb service in saveProducts");
    console.log(products);

    if (!this.myDatabase) {
      console.error('Database not initialized');
      return;
    }

    // Iterate through each product and save it to the database
    for (const product of products) {
      try {
        let ifExists = await this.myDatabase["products"].find({
          selector: {
            key: product.key,
          },
        }).exec();

        const productAlreadyExists = ifExists.length > 0;
        // console.log("condition exists or not " + productAlreadyExists);

        if (productAlreadyExists) {
          // await existingProduct.update({ $set: product });
          console.log(`Product '${product.name}' already exists`);
        } else {
          await this.myDatabase['products'].insert(product);
          // console.log("this product added to offline database ");
          // console.log(product);
          console.log(`Product '${product.name}' added to the offline database`);
        }
      } catch (error) {
        console.error(`Error saving product '${product.name}':`, error);
        console.error(error.stack); // Log the stack trace for more details
      }
    }
  }


  async getSavedProducts(): Promise<Product[]> {
    if (!this.myDatabase) {
      console.error('Database not initialized.');
      return [];
    }

    try {
      const products = await this.myDatabase['products'].find().exec();
      console.log('Products retrieved:');
      return products;
    } catch (error) {
      console.error('Error retrieving products:', error);
      return [];
    }
  }

  // async addNewProductForSyncLater(product: Product): Promise<void> {
  //   console.log(product)
  //   console.log("1")
  //   let newProduct: Product;
  //   try {
  //     const data = await this.imageService.fileToBase64(product.image);
  //     console.log("2")
  //     newProduct = {
  //       key: '1',
  //       ...product
  //     };
  //     newProduct.image = null
  //     newProduct.imageUrl = data
  //     console.log('New Product:', newProduct);
  //   } catch (error) {
  //     console.error('Error:', error.message);
  //   }
  //   console.log("3")
  //
  //   const rxDocument: RxDocument = await this.myDatabase['syncProducts'].insert(newProduct);
  //   console.log("4")
  //
  //
  // }
  async addNewProductForSyncLater(product: Product): Promise<void> {
    product.key = "23"
    console.log(product)

   await this.imageService.convertImageToBase64(product.image).then((stringData)=>{
     product.imageUrl = stringData
   })
    product.image = null ;


    let documnet :RxDocument= await this.myDatabase['syncProducts'].insert(product)






  }
  async getProductsForSyncing(): Promise<Product[]> {
    if (!this.myDatabase) {
      console.error('Database not initialized.');
      return [];
    }

    try {
      const products = await this.myDatabase['syncProducts'].find().exec();
      console.log('sync Products retrieved:');
      return products;
    } catch (error) {
      console.error('Error retrieving sync products:', error);
      return [];
    }
  }

  async deleteSyncedProduct(productKey: string): Promise<void> {
    if (!this.myDatabase) {
      console.error('Database not initialized.');
      return;
    }

    try {
      // Find the product with the specified key
      const product = await this.myDatabase['syncProducts'].findOne({
        selector: {
          key: productKey
        }
      }).exec();

      if (product) {
        // If the product is found, remove it from the database
        await product.remove();
        console.log(`Product with key ${productKey} deleted.`);
      } else {
        console.log(`Product with key ${productKey} not found.`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
}
// private async insertSampleObject(database: RxDatabase): Promise<void> {
//
//   const sampleObject = {
//     id: '1',
//     name: 'Sample Product',
//     basePrice: 10.99,
//     salePrice: 8.99,
//     quantity: 100,
//     image: 'sample-image.jpg',
//     imageUrl: 'https://example.com/sample-image.jpg',
//     category: 'Other',
//     sellQuantity: 0,
//   };
//
//
//   try {
//     const myDocument = await database['products'].insert(sampleObject);
//     console.log('Sample object inserted:', sampleObject);
//   } catch (error) {
//     console.error('Error inserting sample object:', error);
//   }
//   console.log('Sample object inserted:', sampleObject);
// }
