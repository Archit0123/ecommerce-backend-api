//This util is going to help us with the searching,filtering and pagination of queries. All filters and searches work through the queries.
//Therefore if we could find a way to inject information from a query straight into the backend code our lives would be much easier.
//Where clause helps us to do that.
//In an Ecommerce app a user might want to apply many filters to find his desired product easy
//It is basically a way to reduce the complexity in filtering allowing use to filter and find entries in out databse acc to user requirement
// with functional programming
//Consider and test the code written with this example to better understand the concept and why we would want to use whereClause.

//base- Product.find()
//query- /products?search="coder"&page="2"&rating[gte]=3&price[lte]=1999

//We want to find databse entry corresponding to base and query.
//Also we'll be using some concepts from javascript here like "regex" which for now u have understood for now
//But u ill forget it very soon as u have not written it anywhere and u watched Hitesh's video.
//The video is the 2nd lecture of "Working with Product model"
class whereClause {
  constructor(base, query) {
    this.base = base;
    this.query = query;
  }

  //This will handle the queries from the search bar for us
  search() {
    console.log(`Inside the search function base is initially ${this.base}`);
    const searchword = this.query.search
      ? {
          name: {
            $regex: this.query.search, //This crafts the search word into a regex for us. feature provided by mongodb and mongoose
            $options: "i", //there are 2 option 'g and 'i'. 'g' is global search, 'i' is for case insensitivity
          },
        }
      : {};

    console.log(`The searchword becomes ${searchword}`);
    this.base = this.base.find({ ...searchword });

    console.log(`The base becomes ${this.base}`);
    return this;
  }

  //This function is going to handle the logic for pagination for us i.e how many products to show on one page
  pager(resultPerPage) {
    //By default always assume currentPage to be 1. Then check whether u have a page related query andupdate accordingly
    let currentPage = 1;

    if (this.query.page) {
      currentPage = this.query.page;
    }

    //Lets say we want to show the first 5 products on page one and the next 5 on page 2.
    //This next block of code helps us with this

    const skipVal = resultPerPage * (currentPage - 1);
    this.base = this.base.limit(resultPerPage).skip(skipVal);
    console.log(`The base becomes ${this.base}`);
    return this;

    //Product.limit(5) will only fetch us the first 5 entries. Product.skip(5) will skip the first 5 entries.
  }

  //This function will help put up filters
  filter() {
    console.log(`Start if Filter Function ${this.base}`);
    let copyQuery = { ...this.query };

    //Deleting fields related to searching and pagination as we have handled it seperately
    delete copyQuery.search;
    delete copyQuery.page;
    delete copyQuery.limit;

    //By default this.query returns an object.We need to strigify this to perform operations.
    let copyQueryString = JSON.stringify(copyQuery);
    console.log();
    console.log(copyQueryString);

    //Creating a regex to match

    //Adding a $ before the gte and lte queries to directly inject it into a database query.
    copyQueryString = copyQueryString.replace(
      /\b(gte|lte)\b/g,
      (match) => `$${match}`
    );
    console.log();
    console.log(copyQueryString);

    //Now we need this back in json form.
    const copyQueryJson = JSON.parse(copyQueryString);

    this.base = this.base.find(copyQueryJson);
    console.log(`At the end of filter function base = ${this.base}`);
    return this;
  }
}

module.exports = whereClause;
