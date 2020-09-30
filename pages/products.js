import {
  Page,
  Loading, Card,
  ResourceList,
  FilterType,
  Pagination,
  Modal, Stack,
  TextField,
  Button
} from '@shopify/polaris'
import {useEffect, useState, Component} from 'react'

import ProductListItem from './components/ProductListItem';
import IndexPagination from './components/IndexPagination';

const resourceName = {
  singular: 'product',
  plural: 'products',
}

const sortOptions = [
  {label: 'Newest', value: 'DATE_ADDED_DESC'},
  {label: 'Oldest', value: 'DATE_ADDED_ASC'},
  {label: 'Price ascending', value: 'PRICE_ASC'},
  {label: 'Price descending', value: 'PRICE_DESC'},
  {label: 'A-Z', value: 'ALPHABETICAL_ASC'},
  {label: 'Z-A', value: 'ALPHABETICAL_DESC'},
  {label: 'Build time ascending', value: 'BUILD_TIME_ASC'},
  {label: 'Build time descending', value: 'BUILD_TIME_DESC'}
];

const availableFilters = [
  {
    key: 'priceFilter',
    label: 'Price',
    operatorText: 'is greater than',
    type: FilterType.TextField,
  },
  {
    key: 'tagsFilter',
    label: 'Tagged with',
    type: FilterType.TextField,
  },
  {
    key: 'collectionFilter',
    label: 'In collection',
    type: FilterType.Select,
  },
  {
    key: 'timeFilter',
    label: 'Build time',
    operatorText: 'is greater than',
    type: FilterType.TextField,
  },
];

const parseBuildTime = (time) => {
  const t = time.split(' ')[1]
  const hrs = parseInt(t.split('h')[0])
  const mins = parseInt(t.split('h')[1].split('m')[0]) || 0
  return hrs + mins / 60
}

// const compareBuildTimes = (t1, t2) => {
//   if (t1.h > t2.h || (t1.h == t2.h && t1.m > t2.m))
//     return 1;
//   else return -1;
// }

export default function Products({db, shopOrigin}) {
  const [products, setProducts] = useState([])
  const [collections, setCollections] = useState([])
  const getCollections = (shop, products) => {
        fetch(`https://maraismara.xyz/get_collections?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}`, {
          method: "post",
        }).then(
          response => response.json().then(
            data => {
              setCollections(data.collections)
              setProducts(products)
            }
          )
        )


  }
  useEffect(() => {
      db.get(shopOrigin).then((shop) => {
          fetch(`https://maraismara.xyz/get_products?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}`, {
            method: "post",
          }).then(
            response => response.json().then(
              data => {
                var products = data.products;
                for (var product of products) {
                  var avatarSource = null;
                  var buildTime = 'buildTime: 0h0m'
                  if (product.images.length > 0) {
                    avatarSource = product.images[0].src
                  }
                  const initials = product.title.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '')
                  const taglist = product.tags.split(',')
                  for (var tag of taglist) {
                    if (tag.includes('buildTime:'))
                      buildTime = tag
                  }
                  products[products.indexOf(product)] = {avatarSource, buildTime, initials, ...product}
                }
                getCollections(shop, products)
              }
            )
          )
        }
      )
    }
    , [])
  return (
    <Page>
      {/*<style>*/}
      {/*  {`*/}
      {/*    .Polaris-ResourceList__CheckableButtonWrapper{*/}
      {/*      visibility: hidden;*/}
      {/*    }*/}
      {/*    .Polaris-ResourceItem__Handle {*/}
      {/*    display:none;*/}
      {/*    }*/}
      {/*    `*/}
      {/*  }*/}
      {/*</style>*/}
      {products.length ? <ProductList products={products} db={db} shopOrigin={shopOrigin} setProducts={setProducts} collections={collections}/> :
        <Loading/>}
    </Page>
  )
}

class ProductList extends Component {
  constructor(props) {
    super(props);
    const options = this.props.collections.map(collection=>collection.title)
    const availableFilters = [
      {
        key: 'collectionFilter',
        label: 'Collection',
        operatorText: 'is',
        type: FilterType.Select,
        options: options,
      }
    ]
    this.state = {
      items: this.props.products,
      itemsUnsorted: this.props.products,
      sortValue: 'ALPHABETICAL_ASC',
      appliedFilters: [],
      searchValue: '',
      pageNum: 0,
      selectedItems: [],
      availableFilters: availableFilters,
      appliedFilters: [],
      modalOpen: false
    }
    this.handleSortChange = this.handleSortChange.bind(this)
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.handleSaveFilters = this.handleSaveFilters.bind(this)
    this.handlePage = this.handlePage.bind(this)
    this.handleSelectionChange = this.handleSelectionChange.bind(this)
    this.handleBulkEdit = this.handleBulkEdit.bind(this)
    this.handleFiltersChange = this.handleFiltersChange.bind(this)
    this.closeModal=this.closeModal.bind(this)
  }

  render() {
    var {
      items,
      selectedItems,
      sortValue,
      availableFilters,
      appliedFilters,
      searchValue,
      pageNum,
      selectedItems,
      modalOpen
    } = this.state;
    const {db, shopOrigin} = this.props
    const itemsPerPage = 30
    const pages = Math.ceil(items.length / itemsPerPage)
    const products = items.slice(pageNum * itemsPerPage, (pageNum + 1) * itemsPerPage)


    const paginationMarkup = products.length > 0
      ? (
        <IndexPagination>
          <Pagination
            hasPrevious={pageNum == 0 ? false : true}
            hasNext={pageNum == pages-1 ? false : true}
            onPrevious={() => this.handlePage(-1)}
            onNext={() => this.handlePage(1)}
          />
        </IndexPagination>
      )
      : null;
    const Resource = (
      <ResourceList
        resourceName={resourceName}
        items={products}
        renderItem={(product) => <ProductListItem {...product} shopOrigin={shopOrigin}/>}
        selectedItems={selectedItems}
        onSelectionChange={this.handleSelectionChange}
        promotedBulkActions={[
          {content: 'Edit build time', onAction: this.handleBulkEdit},
        ]}
        // bulkActions={[
        //   {content: 'Add tags', onAction: this.handleBulkAddTags},
        //   {content: 'Remove tags', onAction: this.handleBulkRemoveTags},
        //   {content: 'Delete customers', onAction: this.handleBulkDelete},
        // ]}
        sortOptions={sortOptions}
        sortValue={sortValue}
        onSortChange={(selected, id) => this.handleSortChange(selected)}
        filterControl={
          <ResourceList.FilterControl
            resourceName={resourceName}
            filters={availableFilters}
            appliedFilters={appliedFilters}
            onFiltersChange={this.handleFiltersChange}
            searchValue={searchValue}
            onSearchChange={this.handleSearchChange}
            additionalAction={{
              content: 'Save',
              onAction: this.handleSaveFilters,
            }}
          />
        }
        hasMoreItems={true}
      />
    )
    return (
      <Card title={"Products"}>
        <BuildModal db={db} shopOrigin={shopOrigin} open={modalOpen} selectedItems={selectedItems} stateCallback={this.closeModal} items={items}/>
        {Resource}
        {paginationMarkup}
      </Card>
    )
  }

  closeModal(){
    this.setState({modalOpen:false})
  }



  handleFiltersChange(filters) {
    if(filters.length>1)
      filters=[filters[1]]
    const appliedFilters= filters
    const {searchValue} = this.state
    const {db, shopOrigin, collections} = this.props
    if(appliedFilters.length){
      const title = appliedFilters[0].value
      var coll_id=null
      for (var col of collections){
        if (col.title==title)
        {coll_id= col.id;break}
      }
      db.get(shopOrigin).then((shop) => {
        fetch(`https://maraismara.xyz/get_collection_products?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}&collectionId=${coll_id}`, {
          method: "post",
        }).then(
          response => response.json().then(
            data => {
              var products = data.products;
              var items = []
              for (var product of products) {
                if (product.handle.includes(searchValue) || searchValue == '') {
                  var avatarSource = null;
                  var buildTime = 'buildTime: 0h0m'
                  if (product.images.length > 0) {
                    avatarSource = product.images[0].src
                  }
                  const initials = product.title.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '')
                  const taglist = product.tags.split(',')
                  for (var tag of taglist) {
                    if (tag.includes('buildTime:'))
                      buildTime = tag
                  }
                  items.push({avatarSource, buildTime, initials, ...product})
                }
              }
              this.setState({items: items, appliedFilters:appliedFilters})
            }
          )
        )
      })
    }
    else {
      db.get(shopOrigin).then((shop) => {
        fetch(`https://maraismara.xyz/get_products?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}`, {
          method: "post",
        }).then(
          response => response.json().then(
            data => {
              var products = data.products;
              var items = []
              for (var product of products) {
                if (product.handle.includes(searchValue) || searchValue == '') {
                  var avatarSource = null;
                  var buildTime = 'buildTime: 0h0m'
                  if (product.images.length > 0) {
                    avatarSource = product.images[0].src
                  }
                  const initials = product.title.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '')
                  const taglist = product.tags.split(',')
                  for (var tag of taglist) {
                    if (tag.includes('buildTime:'))
                      buildTime = tag
                  }
                  items.push({avatarSource, buildTime, initials, ...product})
                }
              }
              this.setState({items: items, appliedFilters:appliedFilters})
            }
          )
        )
      })
    }
  }

  handleBulkEdit() {
    this.setState({modalOpen: true})
  }

  handleSelectionChange(selected) {
    this.setState({selectedItems: selected})
  }

  handleSearchChange(searchValue) {
    this.setState({searchValue: searchValue})
  }

  handleSaveFilters() {
    const {searchValue, appliedFilters} = this.state
    const {db, shopOrigin, collections} = this.props
    if(appliedFilters.length){
      const title = appliedFilters[0].value
      var coll_id=null
      for (var col of collections){
        if (col.title==title)
        {coll_id= col.id;break}
      }
      db.get(shopOrigin).then((shop) => {
        fetch(`https://maraismara.xyz/get_collection_products?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}&collectionId=${coll_id}`, {
          method: "post",
        }).then(
          response => response.json().then(
            data => {
              var products = data.products;
              var items = []
              for (var product of products) {
                if (product.handle.includes(searchValue) || searchValue == '') {
                  var avatarSource = null;
                  var buildTime = 'buildTime: 0h0m'
                  if (product.images.length > 0) {
                    avatarSource = product.images[0].src
                  }
                  const initials = product.title.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '')
                  const taglist = product.tags.split(',')
                  for (var tag of taglist) {
                    if (tag.includes('buildTime:'))
                      buildTime = tag
                  }
                  items.push({avatarSource, buildTime, initials, ...product})
                }
              }
              this.setState({items: items})
            }
          )
        )
      })
    }
    else {
      db.get(shopOrigin).then((shop) => {
        fetch(`https://maraismara.xyz/get_products?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}`, {
          method: "post",
        }).then(
          response => response.json().then(
            data => {
              var products = data.products;
              var items = []
              for (var product of products) {
                if (product.handle.includes(searchValue) || searchValue == '') {
                  var avatarSource = null;
                  var buildTime = 'buildTime: 0h0m'
                  if (product.images.length > 0) {
                    avatarSource = product.images[0].src
                  }
                  const initials = product.title.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '')
                  const taglist = product.tags.split(',')
                  for (var tag of taglist) {
                    if (tag.includes('buildTime:'))
                      buildTime = tag
                  }
                  items.push({avatarSource, buildTime, initials, ...product})
                }
              }
              this.setState({items: items})
            }
          )
        )
      })
    }
  }

  handlePage(i) {
    const {pageNum} = this.state;
    this.setState({pageNum: pageNum + i})
  }

  handleSortChange(sortValue) {
    const {db, shopOrigin} = this.props;
    db.get(shopOrigin).then((shop) => {
      fetch(`https://maraismara.xyz/get_products?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}`, {
        method: "post",
      }).then(
        response => response.json().then(
          data => {
            var products = data.products;
            for (var product of products) {
              var avatarSource = null;
              var buildTime = 'buildTime: 0h0m'
              if (product.images.length > 0) {
                avatarSource = product.images[0].src
              }
              const initials = product.title.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '')
              const taglist = product.tags.split(',')
              for (var tag of taglist) {
                if (tag.includes('buildTime:'))
                  buildTime = tag
              }
              products[products.indexOf(product)] = {avatarSource, buildTime, initials, ...product}
            }
            const sortVal = sortValue
            var asc = null;
            const ascs = sortVal.split('_')[sortVal.split('_').length - 1]
            if (ascs == 'ASC') asc = true;
            else asc = false;
            const type = sortVal.split('_')[0]
            var callbackFn
            switch (type) {
              case 'DATE': {
                callbackFn = (a, b) => {
                  const d1 = Date.parse(a.updated_at)
                  const d2 = Date.parse(b.updated_at)
                  if (asc == true) {
                    return d1 - d2
                  } else {
                    return d2 - d1
                  }

                }
                break
              }
              case 'PRICE': {
                callbackFn = (a, b) => {
                  const p1 = a.variants[0].price
                  const p2 = b.variants[0].price
                  if (asc == true) {
                    return p1 - p2
                  } else {
                    return p2 - p1
                  }

                }
                break
              }
              case 'ALPHABETICAL': {
                callbackFn = (a, b) => {
                  const d1 = a.handle
                  const d2 = b.handle
                  if (asc == true) {
                    return d1.localeCompare(d2)
                  } else {
                    return d2.localeCompare(d1)
                  }
                }
                break
              }
              case 'BUILD': {
                callbackFn = (a, b) => {
                  const d1 = parseBuildTime(a.buildTime)
                  const d2 = parseBuildTime(b.buildTime)
                  if (asc == true) {
                    return d1 - d2
                  } else {
                    return d2 - d1
                  }
                }
              }
            }
            const items = products.sort(callbackFn)
            this.setState({sortValue: sortVal, items: items})
          }
        )
      )
    })
  }
}

function BuildModal(props) {
  const [loading, setLoading] = useState(false)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [mErr, setMErr] = useState(false)
  const [hErr, setHErr] = useState(false)
  const handleMinutes = (val) => {
    if (parseInt(val)<60&&parseInt(val)>=0) setMinutes(parseInt(val))
  }
  const handlHours = (val) => {
    if (parseInt(val)<24&&parseInt(val)>=0) setHours(parseInt(val))
  }
  const handleClick = () => {
    setLoading(true)
    if(selectedItems=="All")
      selectedItems=props.items.map(item=>item.id)
    var err=null
    var h=parseInt(hours)
    var m=parseInt(minutes)
    if (h>=0)setHErr(false);else {err= true; setHErr(true)}
    if (m>=0&&m<=60) setMErr(false); else{err=true; setMErr(true)}
    if(!err) {
      const {db, shopOrigin, selectedItems, stateCallback} = props
      db.get(shopOrigin).then((shop) => {
        fetch(`https://maraismara.xyz/set_time?shopOrigin=${shopOrigin}&accessToken=${shop.accessToken}`, {
          method: "post",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({items: selectedItems, h:h, m:m})
        }).then(
          response => window.location.reload())
      })
    }
  }
  const {open, stateCallback, selectedItems} = props
  return (
    <Modal open={open} onClose={stateCallback}>
      <Modal.Section>
    <Stack>
            <TextField type="number" placeholder="Hours" value={hours} onChange={setHours}
            error={hErr?"Can't be negative":null}/>
            <TextField
              type="number"
              placeholder="Minutes"
              value={minutes}
              onChange={setMinutes}
              error={mErr?"Use a number between 0 and 60":null}
            />
            <Button primary loading={loading} onClick={handleClick}>
              Set Build Time
            </Button>
    </Stack>
      </Modal.Section>
    </Modal>
  )
}
