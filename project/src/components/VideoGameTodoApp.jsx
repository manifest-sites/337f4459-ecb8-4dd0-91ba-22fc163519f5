import { useState, useEffect } from 'react'
import { Card, Button, Form, Input, Select, Badge, Progress, notification, Typography, Space, Divider } from 'antd'
import { PlusOutlined, TrophyOutlined, StarOutlined, FireOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Quest } from '../entities/Quest'

const { Title, Text } = Typography
const { TextArea } = Input

const VideoGameTodoApp = () => {
  const [quests, setQuests] = useState([])
  const [totalXP, setTotalXP] = useState(0)
  const [playerLevel, setPlayerLevel] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const difficultyColors = {
    Easy: '#52c41a',
    Medium: '#faad14',
    Hard: '#f5222d',
    Epic: '#722ed1'
  }

  const difficultyIcons = {
    Easy: <StarOutlined />,
    Medium: <FireOutlined />,
    Hard: <ThunderboltOutlined />,
    Epic: <TrophyOutlined />
  }

  const categoryColors = {
    Daily: '#1890ff',
    Main: '#f5222d',
    Side: '#52c41a',
    Achievement: '#722ed1'
  }

  useEffect(() => {
    loadQuests()
  }, [])

  useEffect(() => {
    setPlayerLevel(Math.floor(totalXP / 100) + 1)
  }, [totalXP])

  const loadQuests = async () => {
    try {
      setLoading(true)
      const response = await Quest.list()
      if (response.success) {
        setQuests(response.data)
        const completedXP = response.data
          .filter(quest => quest.completed)
          .reduce((sum, quest) => sum + (quest.xpReward || 0), 0)
        setTotalXP(completedXP)
      }
    } catch (error) {
      notification.error({
        message: 'Error loading quests',
        description: 'Failed to load your quest log'
      })
    } finally {
      setLoading(false)
    }
  }

  const createQuest = async (values) => {
    try {
      const questData = {
        ...values,
        completed: false,
        xpReward: getDifficultyXP(values.difficulty)
      }
      const response = await Quest.create(questData)
      if (response.success) {
        await loadQuests()
        form.resetFields()
        notification.success({
          message: 'Quest Added!',
          description: `New ${values.difficulty} quest "${values.title}" has been added to your quest log!`
        })
      }
    } catch (error) {
      notification.error({
        message: 'Quest Creation Failed',
        description: 'Unable to add quest to your log'
      })
    }
  }

  const completeQuest = async (questId) => {
    try {
      const quest = quests.find(q => q._id === questId)
      const response = await Quest.update(questId, { completed: true })
      if (response.success) {
        await loadQuests()
        setTotalXP(prev => prev + quest.xpReward)
        notification.success({
          message: 'Quest Completed! 🎉',
          description: `You earned ${quest.xpReward} XP! Total XP: ${totalXP + quest.xpReward}`,
          duration: 3
        })
      }
    } catch (error) {
      notification.error({
        message: 'Quest Update Failed',
        description: 'Unable to complete quest'
      })
    }
  }

  const getDifficultyXP = (difficulty) => {
    const xpMap = { Easy: 10, Medium: 25, Hard: 50, Epic: 100 }
    return xpMap[difficulty] || 10
  }

  const getProgressToNextLevel = () => {
    const currentLevelXP = (playerLevel - 1) * 100
    const xpInCurrentLevel = totalXP - currentLevelXP
    return (xpInCurrentLevel / 100) * 100
  }

  const renderQuest = (quest) => (
    <Card
      key={quest._id}
      className={`mb-4 ${quest.completed ? 'opacity-75' : ''}`}
      style={{
        borderLeft: `4px solid ${difficultyColors[quest.difficulty]}`,
        background: quest.completed ? '#f6f6f6' : 'white'
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              color={difficultyColors[quest.difficulty]}
              text={
                <span className="font-medium">
                  {difficultyIcons[quest.difficulty]} {quest.difficulty}
                </span>
              }
            />
            <Badge
              color={categoryColors[quest.category]}
              text={quest.category}
            />
            <Text type="secondary">{quest.xpReward} XP</Text>
          </div>
          <Title level={4} className={quest.completed ? 'line-through text-gray-500' : ''}>
            {quest.title}
          </Title>
          {quest.description && (
            <Text type="secondary" className="block mb-2">
              {quest.description}
            </Text>
          )}
        </div>
        <div className="ml-4">
          {!quest.completed ? (
            <Button
              type="primary"
              size="large"
              className="bg-green-500 hover:bg-green-600 border-green-500"
              onClick={() => completeQuest(quest._id)}
            >
              Complete Quest
            </Button>
          ) : (
            <div className="text-green-500 font-bold text-lg">
              ✓ COMPLETED
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      {/* Player Stats Header */}
      <Card className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="text-white mb-0">Quest Log</Title>
            <Text className="text-gray-200">Adventure awaits, brave hero!</Text>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold mb-1">Level {playerLevel}</div>
            <div className="text-sm mb-2">{totalXP} Total XP</div>
            <Progress
              percent={getProgressToNextLevel()}
              strokeColor="#ffd700"
              trailColor="rgba(255,255,255,0.3)"
              showInfo={false}
              className="w-32"
            />
            <div className="text-xs mt-1">
              {Math.floor(getProgressToNextLevel())}% to Level {playerLevel + 1}
            </div>
          </div>
        </div>
      </Card>

      {/* Quest Creation Form */}
      <Card title="Create New Quest" className="mb-6">
        <Form form={form} onFinish={createQuest} layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Quest Title"
              name="title"
              rules={[{ required: true, message: 'Quest title is required!' }]}
            >
              <Input placeholder="Enter your quest objective..." size="large" />
            </Form.Item>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true }]}
              initialValue="Daily"
            >
              <Select size="large">
                <Select.Option value="Daily">Daily Quest</Select.Option>
                <Select.Option value="Main">Main Quest</Select.Option>
                <Select.Option value="Side">Side Quest</Select.Option>
                <Select.Option value="Achievement">Achievement</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Quest Description" name="description">
            <TextArea placeholder="Describe your quest objective..." rows={2} />
          </Form.Item>
          <div className="flex justify-between items-center">
            <Form.Item
              label="Difficulty"
              name="difficulty"
              rules={[{ required: true }]}
              initialValue="Easy"
              className="mb-0"
            >
              <Select className="w-32">
                <Select.Option value="Easy">Easy (10 XP)</Select.Option>
                <Select.Option value="Medium">Medium (25 XP)</Select.Option>
                <Select.Option value="Hard">Hard (50 XP)</Select.Option>
                <Select.Option value="Epic">Epic (100 XP)</Select.Option>
              </Select>
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<PlusOutlined />}
              className="bg-green-500 hover:bg-green-600 border-green-500"
            >
              Add Quest
            </Button>
          </div>
        </Form>
      </Card>

      {/* Quest Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{quests.length}</div>
          <div className="text-gray-600">Total Quests</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {quests.filter(q => q.completed).length}
          </div>
          <div className="text-gray-600">Completed</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {quests.filter(q => !q.completed).length}
          </div>
          <div className="text-gray-600">Active</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalXP}</div>
          <div className="text-gray-600">Experience</div>
        </Card>
      </div>

      {/* Quest List */}
      <Card title="Active Quests" loading={loading}>
        {quests.length === 0 ? (
          <div className="text-center py-12">
            <TrophyOutlined className="text-6xl text-gray-400 mb-4" />
            <Title level={3} type="secondary">No quests yet!</Title>
            <Text type="secondary">Create your first quest to begin your adventure!</Text>
          </div>
        ) : (
          <div>
            {/* Active Quests */}
            {quests.filter(q => !q.completed).length > 0 && (
              <>
                <Title level={4} className="text-orange-600 mb-4">
                  🔥 Active Quests ({quests.filter(q => !q.completed).length})
                </Title>
                {quests.filter(q => !q.completed).map(renderQuest)}
              </>
            )}

            {/* Completed Quests */}
            {quests.filter(q => q.completed).length > 0 && (
              <>
                <Divider />
                <Title level={4} className="text-green-600 mb-4">
                  ✅ Completed Quests ({quests.filter(q => q.completed).length})
                </Title>
                {quests.filter(q => q.completed).map(renderQuest)}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default VideoGameTodoApp