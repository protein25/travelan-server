const Promise = require('bluebird');
const decode = require('unescape');
const informationCrawler = require('./utils/informationCrawler');
const informations = require('./models/informations');

function crawl(targetId, pageNo = 1) {
  let findTarget = false;

  return informationCrawler(pageNo)
    .then((results) => Promise.each(results, (result) => { // 순서대로 넣기위해 each 사용
      if (result.id[0] === targetId) {
        findTarget = true;
        return;
      }
      return informations.create({
        dataId: result.id[0],
        title: result.title[0],
        countryName: result.countryName[0],
        content: decode(result.content[0]),
        fileUrl: result.fileUrl[0],
        wrtDt: new Date(result.wrtDt[0]),
      });
    }))
    .then(() => {
      if (findTarget) return;
      return crawl(targetId, pageNo + 1);
    });
}

module.exports = () => {
  informations.findOne({
    order: [['wrtDt', 'desc'], ['createdAt', 'asc']], // 크롤링 후 먼저 나온 글부터 넣기 때문에 wrtDt가 같은경우 createdAt 으로 먼저 insert된 것이 더 최신글임
  })
  .then((lastInformation) => {
    const targetId = lastInformation.dataId;

    crawl(targetId);
  });
}
