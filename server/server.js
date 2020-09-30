import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, {verifyRequest} from "@shopify/koa-shopify-auth";
import graphQLProxy, {ApiVersion} from "@shopify/koa-shopify-graphql-proxy";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import session from "koa-session";
import * as handlers from "./handlers/index";
import {receiveWebhook} from "@shopify/koa-shopify-webhooks";

import Shopify from 'shopify-api-node'
import json from 'koa-json'
import bodyParser from 'koa-bodyparser'
import PouchDB from 'pouchdb'
import fs from 'fs'
// import level from 'pouchdb-adapter-level'

// PouchDB.plugin(level)

const db = new PouchDB('http://0.0.0.0:5984/db')
db.info().then(
  info => {
    console.log(info);


    dotenv.config();
    const port = parseInt(process.env.PORT, 10) || 8081;
    const dev = "dev";
    const app = next({
      dev
    });
    const handle = app.getRequestHandler();
    const {SHOPIFY_API_SECRET, SHOPIFY_API_KEY, SCOPES} = process.env
    console.log(SCOPES)
    app.prepare().then(() => {
      const server = new Koa();
      const router = new Router();
      const webhook = receiveWebhook({
        secret: SHOPIFY_API_SECRET
      })
      server.use(bodyParser())
      server.use(
        session(
          {
            sameSite: "none",
            secure: true
          },
          server
        )
      );
      server.keys = [SHOPIFY_API_SECRET];
      server.use(
        createShopifyAuth({
          apiKey: SHOPIFY_API_KEY,
          secret: SHOPIFY_API_SECRET,
          scopes: [SCOPES],

          async afterAuth(ctx) {
            //Auth token and shop available in session
            //Redirect to shop upon auth
            const {shop, accessToken} = ctx.session;
            console.log(accessToken)
            db.put({_id: shop, accessToken: accessToken}).catch(
              db.get(shop).then(doc => {
                db.remove(doc).then(db.put({_id: shop, accessToken: accessToken}))
              }).catch(
                error => console.log(error)
              )
            )

            // await handlers.registerWebhooks(
            //   shop,
            //   accessToken,
            //   "PRODUCTS_CREATE",
            //   "/webhooks/products/create",
            //   ApiVersion.October19
            // );

            await handlers.registerWebhooks(
              shop,
              accessToken,
              "ORDERS_PAID",
              "/webhooks/orders/paid",
              ApiVersion.October19
            );

            ctx.cookies.set("shopOrigin", shop, {
              httpOnly: false,
              secure: true,
              sameSite: "none"
            });

            ctx.redirect("https://maraismara.xyz/");
          }
        })
      );
      server.use(
        graphQLProxy({
          version: ApiVersion.October19
        })
      );

      router.post("/webhooks/products/create", webhook, ctx => {
        console.log("received webhook: ", ctx.state.webhook);
      });
      router.post("/webhooks/orders/paid", webhook, async ctx => {
        const {id, line_items} = ctx.state.webhook.payload;
        const {domain} = ctx.state.webhook
        var products = []
        const accessToken = await new Promise((resolve, reject)=> db.get(domain).then((shop) => resolve(shop.accessToken)))
        const data = await Promise.all(
          line_items.map(async item=>{
            const ret = await new Promise( (resolve, reject)=>{
              fetch(`https://${domain}/admin/api/2020-04/products/${item.product_id}.json`, {
                method: "get",
                headers: {
                  'X-Shopify-Access-Token': accessToken,
                  'Content-Type': 'application/json'
                }
              }).then(response=>response.json().then(data=>{
                var product= data.product
                product.quantity = item.quantity
                product.status='Not Scheduled'
                console.log(product)
                resolve(product)}))
            })
          return ret
          })
        ).then(allData=>Promise.resolve(allData))
        const order = {id:id, products:data}
        console.log(order)
        fs.writeFile('order.json', JSON.stringify(order), (err) => {
          if (err) {
            throw err;
          }
          console.log("JSON data is saved.");
        })
        ctx.body="OK"
      });

      router.post("/get_products", async function (ctx, next) {
        const {
          shopOrigin, accessToken
        } = ctx.query
        const data = new Promise((resolve, reject) => { // Create new Promise, await will wait until it resolves
          fetch(`https://${shopOrigin}/admin/api/2020-04/products.json`, {
            method: "get",
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }).then(
            response => {
              response.json().then(
                data => {
                  resolve(data)
                }
              )
            }
          )
        })
        const products = await data
        ctx.body = products
      })

      router.post("/get_collection_products", async function (ctx, next) {
        const {
          shopOrigin, accessToken, collectionId
        } = ctx.query
        const data = new Promise((resolve, reject) => { // Create new Promise, await will wait until it resolves
          fetch(`https://${shopOrigin}/admin/api/2020-04/collections/${collectionId}/products.json`, {
            method: "get",
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }).then(
            response => {
              response.json().then(
                data => {
                  resolve(data)
                }
              )
            }
          )
        })
        const products = await data
        ctx.body = products
      })

      router.post("/get_collections", async function (ctx, next) {
        const {
          shopOrigin, accessToken
        } = ctx.query
        const col1 = new Promise((resolve, reject) => { // Create new Promise, await will wait until it resolves
          fetch(`https://${shopOrigin}/admin/api/2020-04/custom_collections.json`, {
            method: "get",
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }).then(
            response => {
              response.json().then(
                data => {
                  resolve(data)
                }
              )
            }
          )
        })
        const col2 = new Promise((resolve, reject) => { // Create new Promise, await will wait until it resolves
          fetch(`https://${shopOrigin}/admin/api/2020-04/smart_collections.json`, {
            method: "get",
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }).then(
            response => {
              response.json().then(
                data => {
                  resolve(data)
                }
              )
            }
          )
        })
        const custom = await col1
        const smart = await col2
        const collections = custom.custom_collections.concat(smart.smart_collections)


        ctx.body = {collections: collections}


      })

      router.post("/set_time", async function (ctx, next) {
        const {
          shopOrigin, accessToken
        } = ctx.query
        const {items, h, m} = ctx.request.body
        const data = await Promise.all(
          items.map(item =>
            fetch(`https://${shopOrigin}/admin/api/2020-04/products/${item}.json`, {
              method: "get",
              headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
              }
            }).then(
              response =>
                response.json().then(
                  data => {
                    var taglist = data.product.tags.split(',')
                    for (var tag of taglist) {
                      if (tag.includes('buildTime'))
                        taglist.splice(taglist.indexOf(tag), 1)
                    }
                    var tags
                    if (taglist.length ==  1 && taglist[0]=='' ) {
                      if(!(h==0&&m==0)){
                      tags = `buildTime: ${h}h${m}m`}
                    } else {
                      if(!(h==0&&m==0)){
                      taglist.push(` buildTime: ${h}h${m}m`)}
                      tags = taglist.join(',')
                    }
                    const reqData = {
                      product: {id:item,tags:tags}
                    }
                    fetch(`https://${shopOrigin}/admin/api/2020-04/products/${item}.json`, {
                      method: "put",
                      headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json'
                      },
                      body:JSON.stringify(reqData)
                    })
                  }
                )
            )
          )
        )
        // const products = await new Promise((resolve, reject) => { // Create new Promise, await will wait until it resolves
        //   fetch(`https://${shopOrigin}/admin/api/2020-04/products.json`, {
        //     method: "get",
        //     headers: {
        //       'X-Shopify-Access-Token': accessToken,
        //       'Content-Type': 'application/json'
        //     }
        //   }).then(
        //     response => {
        //       response.json().then(
        //         data => {
        //           resolve(data)
        //         }
        //       )
        //     }
        //   )
        // })
        ctx.body = 'OK'
      })

      router.post("/get_orders", async function (ctx, next) {
        const {
          shopOrigin, accessToken
        } = ctx.query

        const orders = await new Promise((resolve, reject) => { // Create new Promise, await will wait until it resolves
          fetch(`https://${shopOrigin}/admin/api/2020-04/products.json`, {
            method: "get",
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }).then(
            response => {
              response.json().then(
                data => {
                  resolve(data)
                }
              )
            }
          )
        })
        ctx.body = 'OK'
      })

      router.get("*", verifyRequest({
        authRoute: 'https://maraismara.xyz/auth',
        fallbackRoute: 'https://maraismara.xyz'
      }), async ctx => {
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
      });
      server.use(router.allowedMethods());
      server.use(router.routes());
      server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
      });
    });

  }
)
