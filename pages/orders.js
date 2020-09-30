import {useState, useEffect} from 'react'

export default function Orders ({db, shopOrigin}){
  const [orders, setOrders] = useState([])
  useEffect(() => {
      db.get(shopOrigin).then((shop) => {
          fetch(`https://maraismara.xyz/get_orders?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}`, {
            method: "post",
          }).then(
            response => response.json().then(
              data => {console.log(data)}
              //   var products = data.products;
              //   for (var product of products) {
              //     var avatarSource = null;
              //     var buildTime = 'buildTime: 0h0m'
              //     if (product.images.length > 0) {
              //       avatarSource = product.images[0].src
              //     }
              //     const initials = product.title.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '')
              //     const taglist = product.tags.split(',')
              //     for (var tag of taglist) {
              //       if (tag.includes('buildTime:'))
              //         buildTime = tag
              //     }
              //     products[products.indexOf(product)] = {avatarSource, buildTime, initials, ...product}
              //   }
              //   getCollections(shop, products)
              // }
            )
          )
        }
      )
    }
    , [])
  return(
    'pula'
  )
}
