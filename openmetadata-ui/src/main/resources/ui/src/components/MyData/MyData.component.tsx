/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { HistoryOutlined, PushpinOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { Card, Col, Divider, Row, Tabs } from 'antd';
import ActivityFeedList from 'components/ActivityFeed/ActivityFeedList/ActivityFeedList';
import FeaturedDomain from 'components/FeaturedDomain/FeaturedDomain';
import MyAssetStats from 'components/MyAssetStats/MyAssetStats.component';
import RecentlyViewedList from 'components/recently-viewed/RecentlyViewedList';
import RecentSearchedTermsAntd from 'components/RecentSearchedTerms/RecentSearchedTermsAntd';
import WelcomeScreen from 'components/WelcomeScreen/WelcomeScreen.component';
import { ELASTICSEARCH_ERROR_PLACEHOLDER_TYPE } from 'enums/common.enum';
import { observer } from 'mobx-react';
import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AppState from '../../AppState';
import {
  getUserPath,
  LOGGED_IN_USER_STORAGE_KEY,
} from '../../constants/constants';
import { observerOptions } from '../../constants/Mydata.constants';
import { FeedFilter } from '../../enums/mydata.enum';
import { ThreadType } from '../../generated/entity/feed/thread';
import { Paging } from '../../generated/type/paging';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import ErrorPlaceHolderES from '../common/error-with-placeholder/ErrorPlaceHolderES';
import PageLayoutV1 from '../containers/PageLayoutV1';
import { EntityListWithAntd } from '../EntityList/EntityList';
import Loader from '../Loader/Loader';
import './MyData.css';
import { MyDataProps } from './MyData.interface';

const MyData: React.FC<MyDataProps> = ({
  activityFeeds,
  onRefreshFeeds,
  error,
  data,
  ownedData,
  pendingTaskCount,
  followedData,
  feedData,
  ownedDataCount,
  followedDataCount,
  isFeedLoading,
  postFeedHandler,
  deletePostHandler,
  fetchFeedHandler,
  paging,
  updateThreadHandler,
  isLoadingOwnedData,
}: MyDataProps): React.ReactElement => {
  const { t } = useTranslation();
  const isMounted = useRef(false);
  const [elementRef, isInView] = useInfiniteScroll(observerOptions);
  const [feedFilter, setFeedFilter] = useState(FeedFilter.OWNER);
  const [threadType, setThreadType] = useState<ThreadType>();
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const storageData = localStorage.getItem(LOGGED_IN_USER_STORAGE_KEY);

  const loggedInUserName = useMemo(() => {
    return AppState.getCurrentUserDetails()?.name || '';
  }, [AppState]);

  const usernameExistsInCookie = useMemo(() => {
    return storageData
      ? storageData.split(',').includes(loggedInUserName)
      : false;
  }, [storageData, loggedInUserName]);

  const updateWelcomeScreen = (show: boolean) => {
    if (loggedInUserName) {
      const arr = storageData ? storageData.split(',') : [];
      if (!arr.includes(loggedInUserName)) {
        arr.push(loggedInUserName);
        localStorage.setItem(LOGGED_IN_USER_STORAGE_KEY, arr.join(','));
      }
    }
    setShowWelcomeScreen(show);
  };

  const getAssetPanel = () => {
    return (
      <Card className="panel-shadow-color card-padding-0">
        <Row className="p-y-sm">
          <Col className="p-x-md" span={24}>
            <MyAssetStats entityState={data} />
          </Col>
          <Col span={24}>
            <Divider className="m-y-sm" />
          </Col>
          <Col className="p-x-md" span={24}>
            <RecentSearchedTermsAntd />
          </Col>
        </Row>
      </Card>
    );
  };

  const getRightPanel = useCallback(() => {
    const currentUserDetails = AppState.getCurrentUserDetails();

    return (
      <>
        {/* Pending task count card */}
        {pendingTaskCount ? (
          <div className="tw-mb-5" data-testid="my-tasks-container ">
            <Card
              bodyStyle={{ padding: 0 }}
              className="panel-shadow-color"
              extra={
                <>
                  <Link
                    data-testid="my-data"
                    to={getUserPath(
                      currentUserDetails?.name || '',
                      'tasks?feedFilter=ASSIGNED_TO'
                    )}>
                    <span className="tw-text-info tw-font-normal tw-text-xs">
                      {t('label.view-all')}
                    </span>
                  </Link>
                </>
              }
              title={
                <div className="tw-flex tw-item-center ">
                  <SVGIcons
                    alt="Pending tasks"
                    className="tw-mr-2.5"
                    icon={Icons.TASK}
                    title={t('label.task-plural')}
                    width="16px"
                  />
                  {pendingTaskCount}{' '}
                  {pendingTaskCount > 1
                    ? t('label.pending-task-plural')
                    : t('label.pending-task')}
                </div>
              }
            />
          </div>
        ) : null}
        <div data-testid="my-data-container">
          <EntityListWithAntd
            entityList={ownedData}
            headerText={
              <>
                {ownedData.length ? (
                  <Link
                    data-testid="my-data"
                    to={getUserPath(currentUserDetails?.name || '', 'mydata')}>
                    <span className="tw-text-info tw-font-normal tw-text-xs">
                      {t('label.view-all')}{' '}
                      <span data-testid="my-data-total-count">
                        {`(${ownedDataCount})`}
                      </span>
                    </span>
                  </Link>
                ) : null}
              </>
            }
            headerTextLabel={t('label.my-data')}
            loading={isLoadingOwnedData}
            noDataPlaceholder={t('server.no-owned-entities')}
            testIDText="My data"
          />
        </div>
        <div className="tw-mt-5" />
        <div data-testid="following-data-container">
          <EntityListWithAntd
            entityList={followedData}
            headerText={
              <>
                {followedData.length ? (
                  <Link
                    data-testid="following-data"
                    to={getUserPath(
                      currentUserDetails?.name || '',
                      'following'
                    )}>
                    <span className="tw-text-info tw-font-normal tw-text-xs">
                      {t('label.view-all')}{' '}
                      <span data-testid="following-data-total-count">
                        {`(${followedDataCount})`}
                      </span>
                    </span>
                  </Link>
                ) : null}
              </>
            }
            headerTextLabel={t('label.following')}
            loading={isLoadingOwnedData}
            noDataPlaceholder={t('message.not-followed-anything')}
            testIDText="Following data"
          />
        </div>
        <div className="tw-mt-5" />
        <div data-testid="type-data-container">{getAssetPanel()}</div>
        <div className="tw-mt-5" />
      </>
    );
  }, [ownedData, followedData, pendingTaskCount, isLoadingOwnedData]);

  const fetchMoreFeed = useCallback(
    (isElementInView: boolean, pagingObj: Paging) => {
      if (
        isElementInView &&
        pagingObj?.after &&
        !isFeedLoading &&
        isMounted.current
      ) {
        fetchFeedHandler(feedFilter, pagingObj.after, threadType);
      }
    },
    [isFeedLoading, threadType, fetchFeedHandler, isMounted.current]
  );

  useEffect(() => {
    fetchMoreFeed(Boolean(isInView), paging);
  }, [isInView, paging]);

  useEffect(() => {
    isMounted.current = true;
    updateWelcomeScreen(!usernameExistsInCookie);

    return () => updateWelcomeScreen(false);
  }, []);

  const handleFeedFilterChange = useCallback(
    (feedType: FeedFilter, threadType?: ThreadType) => {
      setFeedFilter(feedType);
      setThreadType(threadType);
      fetchFeedHandler(feedType, undefined, threadType);
    },
    [fetchFeedHandler]
  );

  const newFeedsLength = activityFeeds && activityFeeds.length;

  const showActivityFeedList = useMemo(
    () => !(!isFeedLoading && showWelcomeScreen),
    [isFeedLoading, showWelcomeScreen]
  );

  const getMyDataTabContent = () => {
    return (
      <>
        {showActivityFeedList ? (
          <ActivityFeedList
            stickyFilter
            withSidePanel
            appliedFeedFilter={feedFilter}
            deletePostHandler={deletePostHandler}
            feedList={feedData}
            isFeedLoading={isFeedLoading}
            postFeedHandler={postFeedHandler}
            refreshFeedCount={newFeedsLength}
            updateThreadHandler={updateThreadHandler}
            onFeedFiltersUpdate={handleFeedFilterChange}
            onRefreshFeeds={onRefreshFeeds}
          />
        ) : (
          !isFeedLoading && (
            <WelcomeScreen onClose={() => updateWelcomeScreen(false)} />
          )
        )}
        {isFeedLoading ? <Loader /> : null}
        <div
          data-testid="observer-element"
          id="observer-element"
          ref={elementRef as RefObject<HTMLDivElement>}
        />
        {/* Add spacer to work infinite scroll smoothly */}
        <div className="tw-p-4" />
      </>
    );
  };

  const getTabOptions = () => {
    const items: TabsProps['items'] = [
      {
        key: '1',
        label: (
          <>
            <HistoryOutlined />
            {t('label.recent-views')}
          </>
        ),
        children: (
          <div className="mydata-card">
            <RecentlyViewedList />
          </div>
        ),
      },
    ];

    return items;
  };

  return (
    <PageLayoutV1
      leftPanel={undefined}
      pageTitle={t('label.my-data')}
      rightPanel={getRightPanel()}>
      {error ? (
        <ErrorPlaceHolderES
          errorMessage={error}
          type={ELASTICSEARCH_ERROR_PLACEHOLDER_TYPE.ERROR}
        />
      ) : (
        <>
          <Row gutter={16}>
            <Col span={10}>
              <Card>
                <Tabs
                  defaultActiveKey="1"
                  items={[
                    {
                      key: '1',
                      label: (
                        <>
                          <PushpinOutlined /> {t('label.quick-link')}
                        </>
                      ),
                      children: (
                        <div className="mydata-card">
                          <FeaturedDomain />
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col span={14}>
              <Card>
                <Tabs defaultActiveKey="1" items={getTabOptions()} />
              </Card>
            </Col>
          </Row>
          <div style={{ marginTop: '16px' }} />
          <Row gutter={16}>
            <Col span={14}>
              <Card>{getMyDataTabContent()}</Card>
            </Col>
          </Row>
        </>
      )}
    </PageLayoutV1>
  );
};

export default observer(MyData);
